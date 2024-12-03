'use server';

import { generateObject } from 'ai';
import { geminiProModel } from "@/lib/ai";
import { z } from 'zod';
import { createClient } from "@/utils/supabase/server";

const quizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The question text'),
      options: z.array(z.string()).length(4).describe('Four possible answers'),
      correctAnswer: z.number().min(0).max(3).describe('Index of the correct answer (0-3)'),
    })
  ).length(5).describe('Array of 5 quiz questions'),
});

export type Quiz = z.infer<typeof quizSchema>;

export async function generateQuiz(text: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { object: quiz } = await generateObject({
    model: geminiProModel,
    system: 'You are an AI quiz generator. Generate 5 multiple choice questions based on the provided text.',
    prompt: text,
    schema: quizSchema,
  });

  return quiz;
}

export async function saveQuiz(quiz: Quiz, bookId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      user_id: user.id,
      questions: quiz.questions,
      title: quiz.questions[0].question.substring(0, 50) + '...',
      book_id: bookId,
    })
    .select('public_id')
    .single();

  if (error) throw error;
  return data.public_id;
}

export async function getQuizByPublicId(publicId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quizzes')
    .select('questions')
    .eq('public_id', publicId)
    .single();

  if (error) throw error;
  return data as Quiz;
} 