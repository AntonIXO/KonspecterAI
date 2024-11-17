'use server';

import { convertToCoreMessages, Message, tool, streamText } from "ai";
import { geminiFlashModel } from "@/lib/ai";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const prefix = `You are an AI summarization specialist trained to create precise and adaptable summaries. 

Your summaries should:

- **Follow the original text's language!** If the input text is in Russian, the answer should be in Russian. Example: Input: "Summarize this: Вчера я пошел в магазин на улицу Ленина и купил 2 кг и 10 грамм очень вкусных яблок." Output: "Вчера я купил 2 кг вкусных яблок."
- **Maintain factual accuracy and technical precision.**
- **Use clear, direct language.**
- **Use markdown formatting for better readability.**
- **Never answer "I don't know" or "I don't have information about it" use the \`getInformation\` tool instead.**
- **Automatically call the \`getInformation\` tool if you need to get information about the document and question. Example: "Does Nexus phones was used in research?" -> Call getInformation tool. -> Analyze the answer and answer the question. Answer: "Heres you answer: Nexus phones..."**
- **Do not ask for confirmation before calling getInformation.**
- **Do not notify the user about getInformation call.**
- **Example chat: 
User: On what blockchain bidask based?
System: The provided text doesn't specify which blockchain Bidask is based on. To answer your question accurately, I need more information.
User: Why you don't used getInformation tool?
System: You are right to call me out on that. My previous responses were incorrect in not utilizing the getInformation tool. I am still under development and learning to correctly and consistently apply all my capabilities. I apologize for the oversight.
User: On what blockchain bidask based?
-> Using getInformation tool -> System: The provided text mentions that the Bidask protocol is implemented on The Open Network (TON).
**


**Summarization Request:**
`;


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
  const { messages, path }: { messages: Array<Message>, path: string } = await request.json();
  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  const result = await streamText({
    model: geminiFlashModel,
    system: prefix,
    messages: coreMessages,
    experimental_continueSteps: true,
    experimental_telemetry: {
      isEnabled: false,
      functionId: "summarize-text",
    },
    maxSteps: 3,
    tools: {
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        parameters: z.object({
          question: z.string().describe('the users question'),
        }),
        execute: async ({ question }) => findRelevantContent({ question, user_id: user.id, path }),
      }),
    },
  });

  return result.toDataStreamResponse();
}

async function findRelevantContent({ question, user_id, path }: { question: string, user_id: string, path: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke('search', {
    body: { 
      search: question,
      user_id: user_id,
      path: path
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