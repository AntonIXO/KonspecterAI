import { createClient } from "@/utils/supabase/client";

export const fetchQuizzes = async (filename: string) => {
  const supabase = createClient();
  const { data: quizzes, error } = await supabase
    .from('quizzes')
    .select('public_id, title, path, created_at')
    .eq('path', filename)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
    return [];
  }

  return quizzes.map((quiz: any) => ({
    title: quiz.title,
    url: `/quiz/${quiz.public_id}`,
  }));
};

export const deleteQuiz = async (quizUrl: string) => {
  const supabase = createClient();
  const quizId = quizUrl.split('/').pop();
  
  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('public_id', quizId);

  if (error) throw error;
}; 