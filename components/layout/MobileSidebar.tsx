
"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function MobileSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden mr-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-sidebar w-72">
                <Sidebar className="hidden lg:block w-full border-r-0" />
                {/* We reuse Sidebar but force it to show. 
            However, Sidebar component had 'hidden lg:block' class. 
            We need to override that or make Sidebar flexible.
            Let's adjust Sidebar to accept className better or duplicate nav logic if easier. 
            Actually, Sidebar code has 'hidden lg:block' inside it. 
            I should update Sidebar to not hide itself if className removes it, or just copy the Nav items logic.
            
            Better approach: Update Sidebar.tsx to remove 'hidden lg:block' from the root div 
            and let the parent control visibility.
         */}
                <div className="h-full py-4">
                    <Sidebar className="block w-full h-full border-none" />
                </div>
            </SheetContent>
        </Sheet>
    );
}
