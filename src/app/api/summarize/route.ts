'use server';

import { convertToCoreMessages, Message, streamText } from "ai";
import { geminiProModel } from "@/lib/ai";
import { ollama } from 'ollama-ai-provider';

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
  });

  return result.toDataStreamResponse();
}