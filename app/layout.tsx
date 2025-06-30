import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Employee Performance Tracker",
  description: "Modern SaaS dashboard for employee performance management",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full overflow-hidden">
              <AppSidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <TopBar />
                <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
                  {children}
                </main>
              </div>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
