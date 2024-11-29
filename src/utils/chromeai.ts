import { generateText } from 'ai';
import { chromeai } from 'chrome-ai';

export async function summarizeWithChromeAI(text: string, compressionMode: string) {
  try {
    let prompt = '';
    if (compressionMode === '1:2') {
      prompt = `Summarize this text in half the length while preserving key information: ${text}`;
    } else if (compressionMode === '1:3') {
      prompt = `Summarize this text in one-third the length while preserving key information: ${text}`;
    }

    const { text: summary } = await generateText({
      model: chromeai(),
      prompt,
    });

    return summary;
  } catch (error) {
    console.error('Chrome AI summarization error:', error);
    return null;
  }
}