import { generateText } from 'ai';
import { chromeai } from 'chrome-ai';
import { compressionPrompt } from '@/lib/ai/propmts';

// Check if the Summarizer API is available in the browser
const isSummarizerAvailable = () => {
  return 'ai' in window && 'summarizer' in (window as any).ai;
};

export async function summarizeWithChromeAI(text: string, compressionMode: string) {
  try {
    // Check if the API is available
    if (!isSummarizerAvailable()) {
      throw new Error('Summarizer API is not available in this browser');
    }

    // Get capabilities
    const capabilities = await (window as any).ai.summarizer.capabilities();
    if (capabilities.available === 'no') {
      throw new Error('Summarizer API is not usable at the moment');
    }

    // Configure summarizer options based on compression mode
    const options = {
      type: 'tl;dr', // 'key-points' or 'tl;dr'
      format: 'markdown', // markdown or plain text
      length: 'long', // 1:3 uses long length. short/medium/long
    //   sharedContext: compressionPrompt
    };

    // Create summarizer
    const summarizer = await (window as any).ai.summarizer.create(options);

    // Wait for the model to be ready if needed
    if (capabilities.available === 'after-download') {
      await new Promise((resolve) => {
        summarizer.addEventListener('downloadprogress', (e: any) => {
          console.log(`Downloading model: ${e.loaded}/${e.total} bytes`);
          if (e.loaded === e.total) {
            resolve(true);
          }
        });
      });
      await summarizer.ready;
    }

    // Use streaming summarization
    const stream = await summarizer.summarizeStreaming(text, {
        sharedContext: compressionPrompt
    //   context: compressionMode === '1:2' 
    //     ? 'Summarize this content to about half its original length'
    //     : 'Summarize this content to about one-third its original length'
    });

    // Return an async generator that yields summary chunks
    return {
      stream: async function* () {
        let previousLength = 0;
        try {
          for await (const segment of stream) {
            const newContent = segment.slice(previousLength);
            previousLength = segment.length;
            yield newContent;
          }
        } catch (error) {
          console.error('Streaming error:', error);
          yield fallbackCompression(text, compressionMode);
        }
      }
    };

  } catch (error) {
    console.error('Chrome Summarizer API error:', error);
    
    // Fallback to basic text compression if API is not available
    if (!isSummarizerAvailable()) {
      return {
        stream: async function* () {
          yield fallbackCompression(text, compressionMode);
        }
      };
    }
    
    return null;
  }
}

// Fallback compression function when API is not available
function fallbackCompression(text: string, mode: string): string {
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  if (mode === '1:2') {
    // Keep every other sentence for 1:2 compression
    return sentences
      .filter((_, index) => index % 2 === 0)
      .join(' ');
  } else if (mode === '1:3') {
    // Keep every third sentence for 1:3 compression
    return sentences
      .filter((_, index) => index % 3 === 0)
      .join(' ');
  }
  
  return text;
}