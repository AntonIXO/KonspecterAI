import { compressionPrompt } from '@/lib/ai/propmts';
import { toast } from 'sonner';

// Keep track of the active sessions
let activeSession: any = null;
let sessionInitPromise: Promise<any> | null = null;
let activeDetector: any = null;
let detectorInitPromise: Promise<any> | null = null;
let activeTranslator: any = null;
let translatorInitPromise: Promise<any> | null = null;

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

// Initialize language detector if needed
async function getOrCreateDetector() {
  // Return existing detector if it's already initialized
  if (activeDetector) {
    return activeDetector;
  }

  // Return existing initialization promise if it's in progress
  if (detectorInitPromise) {
    return detectorInitPromise;
  }

  // Create new detector
  detectorInitPromise = (async () => {
    try {
      const canDetect = await (window as any).translation.canDetect();
      
      if (canDetect === 'no') {
        throw new Error('Language detection is not available');
      }

      const detector = await (window as any).translation.createDetector();
      console.log('canDetect', canDetect);

      // Wait for the model to be ready if needed
      if (canDetect === 'after-download') {
        await new Promise((resolve) => {
          const downloadProgress = {
            loaded: 0,
            total: 0
          };
          
          detector.addEventListener('downloadprogress', (e: any) => {
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
        await detector.ready;
      }

      activeDetector = detector;
      return detector;
    } catch (error) {
      console.error('Failed to initialize language detector:', error);
      throw error;
    } finally {
      detectorInitPromise = null;
    }
  })();

  return detectorInitPromise;
}

// Initialize translator if needed
async function getOrCreateTranslator(sourceLanguage: string, targetLanguage: string) {
  // Return existing translator if it's already initialized with same language pair
  if (activeTranslator?.sourceLanguage === sourceLanguage && 
      activeTranslator?.targetLanguage === targetLanguage) {
    return activeTranslator;
  }

  // Clean up existing translator if language pair is different
  if (activeTranslator) {
    try {
      activeTranslator.destroy();
    } catch (error) {
      console.error('Error cleaning up translator:', error);
    }
    activeTranslator = null;
  }

  // Create new translator
  translatorInitPromise = (async () => {
    try {
      const canTranslate = await (window as any).translation.canTranslate({
        sourceLanguage,
        targetLanguage,
      });

      if (canTranslate === 'no') {
        throw new Error(`Translation from ${sourceLanguage} to ${targetLanguage} is not available`);
      }

      const translator = await (window as any).translation.createTranslator({
        sourceLanguage,
        targetLanguage,
      });

      // Wait for the model to be ready if needed
      if (canTranslate === 'after-download') {
        await new Promise((resolve) => {
          translator.addEventListener('downloadprogress', (e: any) => {
            const event = new CustomEvent('modelDownloadProgress', { 
              detail: { loaded: e.loaded, total: e.total } 
            });
            window.dispatchEvent(event);
            
            if (e.loaded === e.total) {
              resolve(true);
            }
          });
        });
        await translator.ready;
      }

      activeTranslator = translator;
      activeTranslator.sourceLanguage = sourceLanguage;
      activeTranslator.targetLanguage = targetLanguage;
      return translator;
    } catch (error) {
      console.error('Failed to initialize translator:', error);
      throw error;
    } finally {
      translatorInitPromise = null;
    }
  })();

  return translatorInitPromise;
}

// Add translation function
export async function translateText(text: string, targetLanguage: string) {
  try {
    // First detect the source language
    const detector = await getOrCreateDetector();
    const results = await detector.detect(text);
    
    // Get the most likely language
    const [topResult] = results;
    if (!topResult || topResult.confidence < 0.5) {
      throw new Error('Could not detect source language confidently');
    }

    const sourceLanguage = topResult.detectedLanguage;
    
    // Don't translate if source and target are the same
    if (sourceLanguage === targetLanguage) {
      return { text, sourceLanguage };
    }

    // Get translator for the language pair
    const translator = await getOrCreateTranslator(sourceLanguage, targetLanguage);
    
    // Translate the text
    const translatedText = await translator.translate(text);
    
    return {
      text: translatedText,
      sourceLanguage
    };
  } catch (error) {
    console.error('Translation error:', error);
    toast.error('Translation failed');
    return null;
  }
}

// Clean up sessions
export function cleanupSession() {
  if (activeTranslator) {
    try {
      activeTranslator.destroy();
    } catch (error) {
      console.error('Error cleaning up translator:', error);
    }
    activeTranslator = null;
  }

  if (activeDetector) {
    try {
      activeDetector.destroy();
    } catch (error) {
      console.error('Error cleaning up detector:', error);
    }
    activeDetector = null;
  }

  if (activeSession) {
    try {
      activeSession.destroy();
    } catch (error) {
      console.error('Error cleaning up session:', error);
    }
    activeSession = null;
  }
}

// Detect language of text
export async function detectLanguage(text: string) {
  try {
    const detector = await getOrCreateDetector();
    const results = await detector.detect(text);
    
    // Get the most likely language (first result)
    const [topResult] = results;
    if (topResult && topResult.confidence > 0.5) { // Confidence threshold
      return {
        language: topResult.detectedLanguage,
        confidence: topResult.confidence
      };
    }
    
    return null;
  } catch (error) {
    console.error('Language detection error:', error);
    toast.error('Language detection failed');
    return null;
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