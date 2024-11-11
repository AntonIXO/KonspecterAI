import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner";

export async function uploadFile(file: File, userId: string) {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from('books')
    .upload(`${userId}/${file.name}`, file)
  if (error) {
    toast.error(error.message);
    return null;
  }

  // toast.success(`${file.name} has been uploaded successfully.`);
  return await getBooks(userId);
}

export async function getBooks(userId: string) {
  const supabase = createClient()
  const { data } = await supabase.storage.from('books').list(userId)
  return data
}

export async function getBookUrl(userId: string, fileName: string) {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('books')
    .download(`${userId}/${fileName}`)

  if (error) {
    toast.error(error.message);
    return null;
  }

  return data;
}

export async function deleteBook(userId: string, fileName: string) {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from('books')
    .remove([`${userId}/${fileName}`])

  
  await supabase
    .from('books')
    .delete()
    .eq('path', fileName)

  if (error) {
    toast.error(error.message);
    return false;
  }

  toast.success(`${fileName} has been deleted.`);
  return true;
}