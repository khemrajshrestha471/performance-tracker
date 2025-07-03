// app/(private)/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import AuthProvider from "@/components/AuthProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Employee Performance Tracker",
  description: "Modern SaaS dashboard for employee performance management",
}

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider defaultOpen={true}>
        <div className={`flex min-h-screen w-full overflow-hidden ${inter.className}`}>
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
              <AuthProvider>
                {children}
              </AuthProvider>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
