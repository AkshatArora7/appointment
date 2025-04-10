import { Mona_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Metadata } from "next";
import { appInfo } from "@/appInfo";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `Book Appointment with ${appInfo.name}`,
  description: "Book your barber appointment with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={monaSans.className + " antialiased bg-abstract-pattern"}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
