import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interface AI Dashboard",
  description: "A2UI design management and preview",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@100..900&family=Roboto:wght@100;300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-800 font-sans">
        <nav className="bg-slate-900 px-8 py-4 flex items-center gap-8 shadow-lg">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="Interface AI" className="w-8 h-8 rounded" />
            <span className="font-heading font-bold text-white text-lg tracking-tight">
              Interface AI
            </span>
          </a>
          <div className="flex items-center gap-1">
            <a
              href="/"
              className="text-slate-300 hover:text-white text-base px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors duration-150"
            >
              Dashboard
            </a>
            <a
              href="/chat"
              className="text-slate-300 hover:text-white text-base px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors duration-150"
            >
              AI Chat
            </a>
          </div>
        </nav>
        <main className="px-8 py-10 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
