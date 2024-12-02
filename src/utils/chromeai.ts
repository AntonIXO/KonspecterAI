import { compressionPrompt, translationFormatPrompt } from '@/lib/ai/propmts';
import { toast } from 'sonner';

// Keep track of the active sessions separately
let activeCompressionSession: any = null;
let compressionSessionInitPromise: Promise<any> | null = null;
let activeTranslationSession: any = null;
let translationSessionInitPromise: Promise<any> | null = null;
let activeDetector: any = null;
let detectorInitPromise: Promise<any> | null = null;
let activeTranslator: any = null;
let translatorInitPromise: Promise<any> | null = null;

// Add these helper functions at the top of the file
const dispatchGenerationStart = () => {
  console.log('Dispatching generation start');
  window.dispatchEvent(new CustomEvent('generationStart'));
};

const dispatchGenerationEnd = () => {
  console.log('Dispatching generation end');
  window.dispatchEvent(new CustomEvent('generationEnd'));
};

// Add a helper function at the top of the file
const dispatchDownloadProgress = (loaded: number, total: number) => {
  console.log('Dispatching download progress:', { loaded, total });
  const event = new CustomEvent('downloadprogress', { 
    detail: { loaded, total } 
  });
  window.dispatchEvent(event);
};

// Check if the Prompt API is available in the browser
export const isPromptAPIAvailable = () => {
  return 'ai' in window && 
         'rewriter' in (window as any).ai;
};

export const isTranslationAPIAvailable = () => {
  return 'translation' in window &&
         'canDetect' in (window as any).translation &&
         'createTranslator' in (window as any).translation;
};

// Initialize rewriter if needed
async function getOrCreateRewriter() {
  if (activeCompressionSession) {
    return activeCompressionSession;
  }

  if (compressionSessionInitPromise) {
    return compressionSessionInitPromise;
  }

  compressionSessionInitPromise = (async () => {
    try {
      // const capabilities = await (window as any).ai.rewriter.capabilities();
      
      // if (capabilities.available === 'no') {
      //   throw new Error('rewriter API is not available');
      // }

      const rewriter = await (window as any).ai.rewriter.create({
        tone: 'as-is',
        format: 'markdown',
        length: 'shorter',
        sharedContext: compressionPrompt
      });

      // if (capabilities.available === 'after-download') {
      //   toast.info('Downloading rewriter model...');
      //   await new Promise((resolve) => {
      //     rewriter.addEventListener('downloadprogress', (e: any) => {
      //       dispatchDownloadProgress(e.loaded, e.total);
      //       if (e.loaded === e.total) {
      //         resolve(true);
      //       }
      //     });
      //   });
      //   await rewriter.ready;
      // }

      activeCompressionSession = rewriter;
      return rewriter;
    } catch (error) {
      console.error('Failed to initialize rewriter:', error);
      throw error;
    } finally {
      compressionSessionInitPromise = null;
    }
  })();

  return compressionSessionInitPromise;
}

// Initialize translation formatting session if needed
async function getOrCreateTranslationFormater() {
  if (activeTranslationSession) {
    return activeTranslationSession;
  }

  if (translationSessionInitPromise) {
    return translationSessionInitPromise;
  }

  translationSessionInitPromise = (async () => {
    try {
      const rewriter = await (window as any).ai.rewriter.create({
        tone: 'as-is',
        format: 'markdown',
        length: 'same',
        sharedContext: translationFormatPrompt
      });

      activeTranslationSession = rewriter;
      return rewriter;
    } catch (error) {
      console.error('Failed to initialize translation formatter:', error);
      throw error;
    } finally {
      translationSessionInitPromise = null;
    }
  })();

  return translationSessionInitPromise;
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

      // Wait for the model to be ready if needed
      if (canDetect === 'after-download') {
        toast.info('Downloading language detection model...');
        await new Promise((resolve) => {
          detector.addEventListener('downloadprogress', (e: any) => {
            dispatchDownloadProgress(e.loaded, e.total);
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
        toast.info('Downloading translation model...');
        await new Promise((resolve) => {
          translator.ondownloadprogress = (e: any) => {
            dispatchDownloadProgress(e.loaded, e.total);
            if (e.loaded === e.total) {
              resolve(true);
            }
          };
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

// Update translation function to use rewriter for formatting
export async function translateText(text: string, targetLanguage: string, signal?: AbortSignal) {
  try {
    dispatchGenerationStart();
    const detector = await getOrCreateDetector();
    const results = await detector.detect(text);
    
    const [topResult] = results;
    if (!topResult || topResult.confidence < 0.5) {
      throw new Error('Could not detect source language confidently');
    }

    const sourceLanguage = topResult.detectedLanguage;
    
    if (sourceLanguage === targetLanguage) {
      return { text, sourceLanguage };
    }

    const translator = await getOrCreateTranslator(sourceLanguage, targetLanguage);
    const translatedText = await translator.translate(text);

    const formatter = await getOrCreateTranslationFormater();
    
    // Use rewriter's streaming API for formatting
    const stream = await formatter.rewriteStreaming(translatedText, {
      context: 'Format this translated text while preserving its structure and meaning'
    });

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
          if (error instanceof Error && error.name === 'AbortError') {
            throw error;
          }
          console.error('Stream error:', error);
        }
      }
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Translation aborted');
      dispatchGenerationEnd();
      throw error;
    }
    console.error('Translation error:', error);
    toast.error('Translation failed');
    dispatchGenerationEnd();
    return null;
  }
}

// Update compression function to use rewriter API
export async function compressWithChromeAI(text: string, compressionMode: string) {
  try {
    dispatchGenerationStart();
    const rewriter = await getOrCreateRewriter();

    // Configure options based on compression mode
    const options = {
      context: `Rewrite this content to about ${compressionMode === '1:2' ? 'half' : 'one-third'} its original length`
    };

    // Use streaming summarization
    const stream = await rewriter.rewriteStreaming(text, options);

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
          if (error instanceof Error && error.name === 'AbortError') {
          } else {
            console.error('Streaming error:', error);
          }
        }
      },
      cancel: () => {
        if (stream.cancel) {
          stream.cancel();
        }
      }
    };
  } catch (error) {
    console.error('rewriter API error:', error);
    toast.error('rewriter API is not usable at the moment');
    return null;
  }
}

// Update cleanup function
export function cleanupSession() {
  dispatchGenerationEnd();
  if (activeCompressionSession) {
    try {
      activeCompressionSession.destroy();
    } catch (error) {
      console.error('Error cleaning up rewriter:', error);
    }
    activeCompressionSession = null;
  }

  if (activeTranslationSession) {
    try {
      activeTranslationSession.destroy();
    } catch (error) {
      console.error('Error cleaning up translation session:', error);
    }
    activeTranslationSession = null;
  }

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