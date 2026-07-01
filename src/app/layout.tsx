import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "@/Provider";
import StoreProvider from "@/redux/StoreProvider";
import InitUser from "@/InitUser";
import AppBackButton from "@/component/AppBackButton";
import AppShell from "@/component/layout/AppShell";
import { ToastProvider } from "@/component/ui/ToastProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SnapMart",
  description: "Multi-Vendor E-commerce website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <Provider>
          <StoreProvider>
            <ToastProvider>
              <InitUser />
              <AppShell>
                <AppBackButton />
                {children}
              </AppShell>
            </ToastProvider>
          </StoreProvider>
        </Provider>
      </body>
    </html>
  );
}
