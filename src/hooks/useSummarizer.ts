import { useState } from 'react';
import { createOllama } from "ollama-ai-provider";
import { streamText } from "ai";

const SUMMARY_PROMPTS = {
  short: "<|start_header_id|>system<|end_header_id|> You are a precise summarization assistant. Your task is to create extremely concise summaries of 2-3 sentences that capture the most essential information. Focus only on the core message or key findings. Avoid any unnecessary details or explanations. Rules: 1. Maximum 3 sentences, 2. Include only the most crucial points, 3. Use clear, direct language, 4. Maintain factual accuracy, 5. No additional commentary, 6. Follow original text language. 7. Use markdown formatting. Text:<|eot_id|> ",
  full: "<|start_header_id|>system<|end_header_id|> You are a highly skilled AI assistant specialized in creating comprehensive summaries of any written content. Your summaries should be clear, structured, and adaptable to both technical and non-technical material. Follow these guidelines: 1. Begin with a brief overview 2. Break down complex concepts into digestible sections 3. Highlight key points and important terminology 4. Include practical applications or implications when relevant 5. Maintain the original content's technical accuracy 6. Use clear headings and bullet points for better readability 7. Use original text language. 8. Use markdown formatting. For technical content: - Define specialized terms - Explain technical concepts clearly - Include relevant code examples or technical specifications - Note any prerequisites or dependencies 8. For narrative content: - Identify main themes and ideas - Outline plot or argument progression - Note significant quotes or examples - Discuss broader implications Text:<|eot_id|> "
};

export function useSummarizer() {
  const [summary, setSummary] = useState<string>("");
  const [summaryOpen, setSummaryOpen] = useState<boolean>(false);

  const ollama = createOllama({
    baseURL: process.env.NEXT_PUBLIC_OLLAMA_BASE_URL,
  });

  const generateSummary = async (text: string, type: 'short' | 'full' = 'short') => {
    try {
      const stream = await streamText({
        model: ollama(type === 'short' ? "llama3.2:1b" : "llama3.2:3b"),
        prompt: SUMMARY_PROMPTS[type] + text,
      });

      let summary = "";
      for await (const chunk of stream.textStream) {
        summary += chunk;
      }
      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  };

  const handlePageSummarize = async (type: 'short' | 'full') => {
    try {
      const page = document.querySelector('.react-pdf__Page');
      const textContent = page?.textContent;

      if (!textContent) {
        throw new Error('No text content found');
      }

      setSummaryOpen(true);
      setSummary(""); // Reset summary before starting new stream
      
      const newSummary = await generateSummary(textContent, type);
      setSummary(newSummary);
    } catch (error) {
      console.error('Error extracting text:', error);
      setSummary("Error generating summary. Please try again.");
    }
  };

  const handleSummarize = async (text: string) => {
    try {

      setSummaryOpen(true);
      setSummary(""); // Reset summary before starting new stream

      const newSummary = await generateSummary(text, 'short');
      setSummary(newSummary);
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummary("Error generating summary. Please try again.");
    }
  };

  return {
    summary,
    summaryOpen,
    setSummaryOpen,
    handlePageSummarize,
    handleSummarize
  };
} 