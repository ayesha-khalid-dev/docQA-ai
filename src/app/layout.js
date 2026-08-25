import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "DocQA - Chat with your Documents",
  description: "Upload a PDF and ask questions instantly using AI.",
  openGraph: {
    title: "DocQA - Chat with your Documents",
    description: "Upload any PDF and ask questions instantly. Powered by AI to give you accurate answers from your own documents.",
    url: "https://doc-qa-ai-jade.vercel.app",
    siteName: "DocQA",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DocQA - Chat with your Documents",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocQA - Chat with your Documents",
    description: "Upload any PDF and ask questions instantly using AI.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-[#EAF4EC]">
          <Navbar />
          <div className="flex-1">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}