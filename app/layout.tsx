import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Switched to Inter (best modern UI font)
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; // Needed for Dark Mode

// Using Inter - The industry standard for modern SaaS dashboards (Linear, Vercel, etc.)
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap", // Prevents invisible text while loading
});

export const metadata: Metadata = {
  title: "CignalPulse | SMS Marketing Platform",
  description: "AI-powered SMS platform for modern businesses. Send, automate, and analyze your text message campaigns.",
  keywords: ["SMS", "Marketing", "Automation", "Text Messaging", "Bulk SMS", "Ghana SMS"],
  authors: [{ name: "CignalPulse Team" }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning // Required for next-themes (Dark Mode)
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-[15px] leading-relaxed text-gray-900 bg-gray-50 dark:bg-gray-950 dark:text-gray-100">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}