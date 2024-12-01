import { compressionPrompt } from '@/lib/ai/propmts';
import { toast } from 'sonner';

// Keep track of the active session
let activeSession: any = null;
let sessionInitPromise: Promise<any> | null = null;

// Check if the Prompt API is available in the browser
export const isPromptAPIAvailable = () => {
  return 'chrome' in window && 
         'self' in window &&
         'ai' in (window as any).self;
};

// Initialize session if needed
async function getOrCreateSession() {
  // Return existing session if it's already initialized
  if (activeSession) {
    return activeSession;
  }

  // Return existing initialization promise if it's in progress
  if (sessionInitPromise) {
    return sessionInitPromise;
  }

  // Create new session
  sessionInitPromise = (async () => {
    try {
      const capabilities = await (window as any).self.ai.languageModel.capabilities();
      
      const session = await (window as any).self.ai.languageModel.create({
        systemPrompt: compressionPrompt,
        temperature: capabilities.defaultTemperature,
        topK: capabilities.defaultTopK
      });

      // Wait for the model to be ready if needed
      if (capabilities.available === 'after-download') {
        await new Promise((resolve) => {
          const downloadProgress = {
            loaded: 0,
            total: 0
          };
          
          session.monitor((m: any) => {
            m.addEventListener('downloadprogress', (e: any) => {
              downloadProgress.loaded = e.loaded;
              downloadProgress.total = e.total;
              
              // Create a custom event to notify UI of download progress
              const event = new CustomEvent('modelDownloadProgress', { 
                detail: downloadProgress 
              });
              window.dispatchEvent(event);
              
              if (e.loaded === e.total) {
                resolve(true);
              }
            });
          });
        });
        await session.ready;
      }

      activeSession = session;
      return session;
    } catch (error) {
      console.error('Failed to initialize session:', error);
      throw error;
    } finally {
      sessionInitPromise = null;
    }
  })();

  return sessionInitPromise;
}

// Clean up session
export function cleanupSession() {
  if (activeSession) {
    try {
      activeSession.destroy();
    } catch (error) {
      console.error('Error cleaning up session:', error);
    }
    activeSession = null;
  }
}

export async function compressWithChromeAI(text: string, compressionMode: string) {
  try {
    // Get or create session
    const session = await getOrCreateSession();

    // Create abort controller for this specific prompt
    const controller = new AbortController();

    // Create the prompt based on compression mode
    const prompt = `Compress the following text to ${compressionMode === '1:2' ? 'half' : 'one-third'} of its original length while preserving key information:

${text}`;

    // Use streaming for better UX with abort signal
    const stream = await session.promptStreaming(prompt, { signal: controller.signal });

    // Return an async generator that yields summary chunks
    return {
      stream: async function* () {
        let previousChunk = '';
        try {
          for await (const chunk of stream) {
            const newChunk = chunk.startsWith(previousChunk)
              ? chunk.slice(previousChunk.length)
              : chunk;
            yield newChunk;
            previousChunk = chunk;
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('Prompt aborted');
          } else {
            console.error('Streaming error:', error);
            // Only cleanup session on non-abort errors
            if (error instanceof Error && error.message?.includes('session')) {
              cleanupSession();
            }
          }
        }
      },
      cancel: () => {
        controller.abort();
      }
    };

  } catch (error) {
    console.error('Chrome Prompt API error:', error);
    toast.error('Prompt API is not usable at the moment');
    
    // Only cleanup session on session-related errors
    if (error instanceof Error && error.message?.includes('session')) {
      cleanupSession();
    }
    
    return null;
  }
}