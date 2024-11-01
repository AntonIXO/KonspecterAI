import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "./ui/button";


interface SummaryProps {
    text: string;
    open: boolean;
    setOpen: (open: boolean) => void;
  }

export function Summary({ text, open, setOpen }: SummaryProps) {
    return (
        <Drawer open={open}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Summary</DrawerTitle>
                </DrawerHeader>
                <p>{text}</p>
                <DrawerFooter>
            <Button>Save</Button>
            <DrawerClose asChild>
              <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </DrawerClose>
          </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}

