'use server';

import { convertToCoreMessages, Message, streamText, tool } from "ai";
import { geminiFlashModel } from "@/lib/ai";
import { ollama } from 'ollama-ai-provider';
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const prefix = `You are an AI summarization specialist trained to create precise and adaptable summaries. Your summaries should:
- Follow the original text's language! If input text is in Russian, answer should be in Russian. Example: Input:"Summarize this: Вчера я пошел в магазин на улицу Ленина и купил 2 кг и 10 грамм очень вкусных яблок." Output: "Вчера я купил 2 кг вкусных яблок."
- Maintain factual accuracy and technical precision
- Use clear, direct language
- Use markdown formatting for better readability
- Call the getInfo tool if you need to get information about the document and question. 
- Do not ask for confirmation before calling the tool. 
- Do not notify the user about the tool call.
`

export async function POST(request: Request) {
  const { messages }: { messages: Array<Message> } = await request.json();
  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  // Use Ollama in development, Gemini in production
  const model = process.env.NODE_ENV === 'development' 
    ? ollama('llama3.2:3b')
    : geminiFlashModel;

  const result = await streamText({
    model,
    system: prefix,
    messages: coreMessages,
    experimental_telemetry: {
      isEnabled: false,
      functionId: "summarize-text",
    },
    maxSteps: 3,
    tools: {
      getInfo: tool({
        description: `get information about document and question.
          If the user provides or asks a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        parameters: z.object({
          content: z
            .string()
            .describe('the content to use in answer.'),
        }),
        execute: async ({ content }) => createResource({ content }),
      }),
    },
  });

  return result.toDataStreamResponse();
}

async function createResource({ content }: { content: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke('search', {
    body: { search: content }
  });

  if (error) {
    // Return an error message if the function call fails
    return { 
      success: false,
      message: 'Failed to add resource',
      error: error.message
    };
  }
  return {
    success: true,
    message: 'Resource added successfully',
    data: data?.result.text?.substring(0, 700) || null
  };
}