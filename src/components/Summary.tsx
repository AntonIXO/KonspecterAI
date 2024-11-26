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
import { useText } from '@/lib/TextContext';
import { ChromeAINotice } from "./ChromeAINotice";

interface SummaryProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    handleSave: (text: string) => void;
    selectedText?: string;
}

export function Summary({ open, setOpen, handleSave, selectedText }: SummaryProps) {
    const { pagesContent } = useText();
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
        if (open) {
            const startChat = async () => {
                try {
                    if (messages.length === 0) {
                        const textToSummarize = selectedText || Object.values(pagesContent).join('\n\n');
                        
                        await append({
                            role: 'user',
                            content: `I want to discuss this text: ${textToSummarize}`
                        });
                    }
                } catch (error) {
                    console.error("Error starting chat:", error);
                }
            };
            startChat();
        }
    }, [open, selectedText, pagesContent, append, messages]);

    const handleClose = useCallback(() => {
        stop(); // Cancel any ongoing requests
        setOpen(false); // Close the drawer
    }, [stop, setMessages, setOpen]);

    const getAllAnswers = () => {
        return messages
            .filter(message => !(message.content.startsWith("I want to")))
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
                <DrawerContent className="max-h-[95dvh] md:max-h-[90vh] flex flex-col">
                    <DrawerHeader className="flex-shrink-0">
                        <DrawerTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            {selectedText ? "Selected Text Summary" : "Page Summary"}
                        </DrawerTitle>
                    </DrawerHeader>
                    
                    <div className="flex-1 overflow-y-auto p-4 min-h-0">
                        {messages
                            .filter(message => !(message.content.startsWith("I want to")))
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

                    <div className="p-4 border-t flex-shrink-0">
                        <form onSubmit={handleMessageSubmit} className="flex gap-2">
                            <Input
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Ask a follow-up question..."
                                className="flex-1"
                                disabled={isLoading}
                            />
                            {isLoading ? (
                                <Button 
                                    type="button" 
                                    onClick={() => stop()}
                                    variant="destructive"
                                >
                                    <StopCircle className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button 
                                    type="submit" 
                                    disabled={!input.trim()}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            )}
                        </form>
                    </div>

                    <DrawerFooter className="flex flex-row gap-2 flex-shrink-0">
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
                {/* <ChromeAINotice /> */}
            </Drawer>
    );
}