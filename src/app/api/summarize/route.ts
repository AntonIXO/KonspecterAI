'use server';

import { convertToCoreMessages, Message, streamText, tool } from "ai";
import { geminiProModel } from "@/lib/ai";
import { ollama } from 'ollama-ai-provider';
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const prefix = `You are an AI summarization specialist trained to create precise and adaptable summaries. Your summaries should:
- Follow the original text's language! If input text is in Russian, answer should be in Russian. Example: Input:"Summarize this: Вчера я пошел в магазин на уличе ленина и купил 2 кг и 10 грамм очень вкусных яблок." Output: "Вчера я купил 2 кг вкусныхяблок."
- Maintain factual accuracy and technical precision
- Use clear, direct language
- Use markdown formatting for better readability
`

export async function POST(request: Request) {
  const { messages }: { messages: Array<Message> } = await request.json();
  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  // Use Ollama in development, Gemini in production
  const model = process.env.NODE_ENV === 'development' 
    ? ollama('llama3.2:3b')
    : geminiProModel;

  const result = await streamText({
    model,
    system: prefix,
    messages: coreMessages,
    experimental_telemetry: {
      isEnabled: false,
      functionId: "summarize-text",
    },
    tools: {
      addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        parameters: z.object({
          content: z
            .string()
            .describe('the content or resource to add to the knowledge base'),
        }),
        execute: async ({ content }) => createResource({ content }),
      }),
    },
  });

  return result.toDataStreamResponse();
}

async function createResource({ content }: { content: string }) {
  const supabase = await createClient();
  console.log("content", content)
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

  // Make sure to return a result even if data is empty
  console.log("data", data)
  return {
    success: true,
    message: 'Resource added successfully',
    data: data?.result || null
  };
}