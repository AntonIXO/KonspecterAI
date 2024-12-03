'use server';

import { convertToCoreMessages, Message, tool, streamText } from "ai";
import { geminiProModel } from "@/lib/ai";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { prompt } from '../../../lib/ai/propmts';


export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is authenticated
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  const { messages, bookId }: { messages: Array<Message>, bookId: number } = await request.json();
  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  const result = streamText({
    model: geminiProModel,
    system: prompt,
    messages: coreMessages,
    experimental_continueSteps: true,
    experimental_toolCallStreaming: true,
    maxSteps: 3,
    experimental_telemetry: {
      isEnabled: false,
      functionId: "summarize-text",
    },
    
    tools: {
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        parameters: z.object({
          question: z.string().describe('the users question'),
        }),
        execute: async ({ question }) => findRelevantContent({ question, user_id: user.id, bookId }),
      }),
    },
  });

  return result.toDataStreamResponse();
}

async function findRelevantContent({ question, user_id, bookId }: { question: string, user_id: string, bookId: number }) {
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke('search', {
    body: { 
      search: question,
      user_id: user_id,
      bookId: bookId
     }
  });

  if (error || !data.result) {
    // Return an error message if the function call fails
    return "Failed to get information";
  }
  return {
    information: data.result,
  };
}