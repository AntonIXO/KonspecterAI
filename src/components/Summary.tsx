import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, Save, X, StopCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Send } from "lucide-react";
import { useEffect, useRef, useCallback } from 'react';
import { useFile } from "@/lib/FileContext";
import { cn } from "@/lib/utils";

interface SummaryProps {
    text: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    handleSave: (text: string) => void;
    type: 'short' | 'full';
}

const SUMMARY_PROMPTS = {
    postfixShort: `
Create an extremely concise summary in 2-3 sentences that captures only the most essential information. 
Focus on the core message and key findings. Avoid any unnecessary details or explanations. 
Use the getInformation tool if you need to get information about the document and question.

Text to summarize: 
`,
    postfixFull: `
Create a comprehensive summary that includes:

1. **Brief overview** (2-3 sentences)
2. **Key points and findings** (using bullet points)
3. **Technical concepts explained** (if present)
4. **Practical implications** (if any)
5. **Important terminology defined** (if any)
6. **Use getInformation tool if you need to get information about the document and question.**

Text to summarize: 
`
}

export function Summary({ text, open, setOpen, handleSave, type }: SummaryProps) {
    const { filename } = useFile();
    const { messages, input, handleInputChange, handleSubmit, isLoading, append, setMessages, stop } = useChat({
        api: '/api/summarize',
        id: 'summary-chat',
        body: {
            path: filename,
        },
        maxSteps: 3,
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (open && text && messages.length === 0) {
            const generateSummary = async () => {
                try {
                    await append({
                        role: 'user',
                        content: type === 'short' 
                            ? SUMMARY_PROMPTS.postfixShort + text 
                            : SUMMARY_PROMPTS.postfixFull + text
                    });
                } catch (error) {
                    console.error("Error generating summary:", error);
                }
            };
            generateSummary();
        }
    }, [open, text, append, messages.length]);

    const handleClose = useCallback(() => {
        stop(); // Cancel any ongoing requests
        setMessages([]); // Clear messages
        setOpen(false); // Close the drawer
    }, [stop, setMessages, setOpen]);

    const getAllAnswers = () => {
        return messages
            .filter(message => message.role === 'assistant')
            .map(message => message.content)
            .join('\n\n---\n\n');
    };

    const handleMessageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Blur any focused element (hide keyboard)
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        handleSubmit(e);
    };

    return (
        <Drawer open={open} onOpenChange={handleClose}>
            <DrawerContent className="max-h-[90vh] flex flex-col">
                <DrawerHeader>
                    <DrawerTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Summary Chat
                    </DrawerTitle>
                </DrawerHeader>
                
                <div className="p-4 flex-1 overflow-y-auto">
                    {messages
                        .filter(message => !(message.content.startsWith("Create")))
                        .map((message) => (
                            <div
                                key={message.id}
                                className={`mb-4 flex flex-col ${
                                    message.role === 'user' ? 'items-end' : 'items-start'
                                }`}
                            >
                                <div
                                    className={cn(
                                        "rounded-lg px-4 py-2 max-w-[80%]",
                                        "bg-muted",
                                        "select-text cursor-text",
                                        "hover:bg-muted/80 transition-colors"
                                    )}
                                >
                                    <div className="prose prose-sm dark:prose-invert">
                                        <ReactMarkdown 
                                            components={{
                                                code: ({ ...props }) => (
                                                    <code className="select-text" {...props} />
                                                ),
                                                p: ({ ...props }) => (
                                                    <p className="select-text" {...props} />
                                                )
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                    
                    {isLoading && (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[30%]" />
                            <Skeleton className="h-4 w-[40%]" />
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t">
                    <form onSubmit={handleMessageSubmit} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask a follow-up question..."
                            className="flex-1"
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !input.trim()}>
                            {isLoading ? (
                                <StopCircle className="w-4 h-4" onClick={(e) => {
                                    e.preventDefault();
                                    stop();
                                }} />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </form>
                </div>

                <DrawerFooter className="flex flex-row gap-2">
                    <Button 
                        onClick={() => handleSave(getAllAnswers())}
                        className="flex items-center gap-2"
                        disabled={isLoading || messages.length === 0}
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={handleClose}
                        className="flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Close
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}