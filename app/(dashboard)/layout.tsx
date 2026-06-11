
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            {/* onMenuClick removed as it caused serialization error and is handled internally by MobileSidebar */}

            <div className="flex flex-1">
                <Sidebar className="hidden lg:block w-64 border-r" />
                <main className="flex-1 p-6 md:p-8 overflow-y-auto h-[calc(100vh-3.5rem)]">
                    {children}
                </main>
            </div>
        </div>
    );
}
