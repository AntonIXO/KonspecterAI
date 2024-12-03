import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export async function updateReadProgress(bookId: number, pagesRead: number) {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('books')
      .update({ pages_read: pagesRead })
      .eq('id', bookId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating read progress:', error);
    toast.error('Failed to save reading progress');
    return false;
  }
}

export async function getReadProgress(bookId: number): Promise<number> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('books')
      .select('pages_read')
      .eq('id', bookId)
      .single();

    if (error) throw error;
    
    if (data.pages_read > 1) {
      toast.info(`Resuming from page ${data.pages_read}`);
    }
    
    return data.pages_read || 1;
  } catch (error) {
    console.error('Error fetching read progress:', error);
    toast.error('Failed to load reading progress');
    return 1;
  }
} 