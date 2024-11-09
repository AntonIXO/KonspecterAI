'use server';

import { convertToCoreMessages, Message, streamText } from "ai";
import { geminiFlashModel } from "@/lib/ai"

const prefix = `You are an AI summarization specialist trained to create precise and adaptable summaries. Your summaries should:
- Maintain factual accuracy and technical precision
- Use clear, direct language
- Follow the original text's language!
- Use markdown formatting for better readability
- Define technical terms when present
- Highlight key findings and implications
`

export async function POST(request: Request) {
  const { messages }: { messages: Array<Message> } = await request.json();

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  const result = await streamText({
    model: geminiFlashModel,
    messages: coreMessages,
    system: prefix,
    experimental_telemetry: {
      isEnabled: false,
      functionId: "summarize-text",
    },
  });

  return result.toDataStreamResponse({});
}