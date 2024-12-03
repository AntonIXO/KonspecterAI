import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner";

export type Book = {
  id: number;
  name: string;
  pages_read: number;
  pages: number;
  user_id: string;
}

export async function uploadFile(file: File, userId: string, pages: number) {
  const supabase = createClient()

  try {
    // First create a book record in the database
    const { data: book, error: dbError } = await supabase
      .from('books')
      .insert({
        name: file.name,
        pages_read: 0,
        pages: pages,
        user_id: userId
      })
      .select()
      .single()

    if (dbError) throw dbError;
    if (!book) throw new Error('Failed to create book record');

    // Then upload file to storage with book.id as filename
    const fileExt = file.name.split('.').pop();
    const storageFile = `${userId}/${book.id}.${fileExt}`;
    
    const { error: storageError } = await supabase.storage
      .from('books')
      .upload(storageFile, file)

    if (storageError) {
      // Cleanup: delete the book record if storage upload fails
      await supabase.from('books').delete().eq('id', book.id);
      throw storageError;
    }

    return await getBooks(userId);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Error uploading file');
    return null;
  }
}

export async function getBooks(userId: string): Promise<Book[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: false })

  if (error) {
    toast.error(error.message);
    return [];
  }

  return data;
}

export async function getBookUrl(bookId: number, userId: string, originalName: string) {
  const supabase = createClient()
  const fileExt = originalName.split('.').pop();
  const storageFile = `${userId}/${bookId}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('books')
    .download(storageFile)

  if (error) {
    toast.error(error.message);
    return null;
  }

  return data;
}

export async function deleteBook(bookId: number, userId: string, originalName: string) {
  const supabase = createClient()
  
  try {
    // Delete from storage first
    const fileExt = originalName.split('.').pop();
    const storageFile = `${userId}/${bookId}.${fileExt}`;
    
    const { error: storageError } = await supabase.storage
      .from('books')
      .remove([storageFile])
    
    if (storageError) throw storageError;

    // Delete related embeddings
    const { error: embeddingsError } = await supabase
      .from('embeddings')
      .delete()
      .eq('book_id', bookId);

    if (embeddingsError) throw embeddingsError;

    // Delete related summaries
    const { error: summariesError } = await supabase
      .from('summaries')
      .delete()
      .eq('book_id', bookId);

    if (summariesError) throw summariesError;

    // Delete related quizzes
    const { error: quizzesError } = await supabase
      .from('quizzes')
      .delete()
      .eq('book_id', bookId);

    if (quizzesError) throw quizzesError;

    // Then delete from database
    const { error: dbError } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId)

    if (dbError) throw dbError;

    toast.success(`${originalName} has been deleted.`);
    return true;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Error deleting book');
    return false;
  }
}

export async function renameBook(book: Book, newName: string, userId: string) {
  const supabase = createClient()
  
  try {
    // Get file extension from current name
    const currentExt = book.name.split('.').pop();
    
    // Automatically append the previous extension to the new name
    const newNameWithExt = `${newName}.${currentExt}`;

    // Update the database with the new name including the extension
    const { error: dbError } = await supabase
      .from('books')
      .update({ name: newNameWithExt })
      .eq('id', book.id)
      .eq('user_id', userId);

    if (dbError) throw dbError;

    // No need to rename in storage since we're using book.id as filename
    
    return await getBooks(userId);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Error renaming book');
    return null;
  }
}