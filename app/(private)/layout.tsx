import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side authentication check
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  if (!token) {
    redirect('/login')
  }

  try {
    verifyAccessToken(token)
  } catch (error) {
    console.log(error)
    redirect('/login')
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className={`flex min-h-screen w-full overflow-hidden`}>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}