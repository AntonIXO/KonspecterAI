import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { useEffect, useState } from "react";

interface SummaryProps {
    text: string;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export function Summary({ text, open, setOpen }: SummaryProps) {
    const [displayText, setDisplayText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!text) {
            setIsLoading(true);
            return;
        }
        
        setDisplayText(""); // Reset display text when new summary starts
        
        // Show skeleton for a brief moment even when text starts streaming
        const loadingTimeout = setTimeout(() => {
            setIsLoading(false);
        }, 300);
        
        // Simulate streaming by splitting text into characters
        const characters = text.split("");
        let currentIndex = 0;
        
        const interval = setInterval(() => {
            if (currentIndex < characters.length) {
                setDisplayText(prev => prev + characters[currentIndex]);
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 20);
        
        return () => {
            clearInterval(interval);
            clearTimeout(loadingTimeout);
        };
    }, [text]);

    return (
        <Drawer open={open}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Summary</DrawerTitle>
                </DrawerHeader>
                <div className="p-4">
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[90%]" />
                            <Skeleton className="h-4 w-[80%]" />
                            <Skeleton className="h-4 w-[85%]" />
                            <Skeleton className="h-4 w-[75%]" />
                        </div>
                    ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {displayText}
                        </p>
                    )}
                </div>
                <DrawerFooter>
                    <Button>Save</Button>
                    <DrawerClose asChild>
                        <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

