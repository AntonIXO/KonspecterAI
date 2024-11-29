import { chromeai } from 'chrome-ai';

// Create default model instance with chat capabilities
export const chromeModel = chromeai('text', {
  temperature: 0.7,
  topK: 5,
});

// Create more deterministic model for structured outputs
export const chromeStructuredModel = chromeai('text', {
  temperature: 0.1,
  topK: 1,
});

// Helper to check Chrome AI availability
export const isChromeAIAvailable = () => {
  if (typeof window === 'undefined') return false;
  
  const isChrome = navigator.userAgent.includes('Chrome/');
  const chromeVersion = isChrome ? 
    parseInt(navigator.userAgent.split('Chrome/')[1]) : 0;
  
  return isChrome && chromeVersion >= 127;
}; 