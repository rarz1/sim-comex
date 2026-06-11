import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SyncProvider } from "@/components/sync/SyncContext";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIM-COMEX PRO",
  description: "Simulador de Comercio Exterior",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${syne.variable} ${dmSans.variable} font-sans`}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SyncProvider>
              {children}
            </SyncProvider>
            <Toaster />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

