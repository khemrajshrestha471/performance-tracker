import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import AuthProvider from "@/components/AuthProvider"

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className={`flex min-h-screen w-full overflow-hidden`}>
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
  )
}