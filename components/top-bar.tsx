"use client"

import { Bell, ChevronDown, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { isAdminUser, useAuthStore } from "@/store/authStore"

export function TopBar() {
  // Get the auth state and actions from the store
  const { user } = useAuthStore();

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-background px-3 sm:px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <SidebarTrigger />
        <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-10 text-sm" />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent hidden sm:flex">
              <span className="hidden lg:inline">Acme Corp</span>
              <span className="sm:hidden lg:hidden">Acme</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Acme Corp</DropdownMenuItem>
            <DropdownMenuItem>Tech Solutions Inc</DropdownMenuItem>
            <DropdownMenuItem>Global Dynamics</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative shrink-0">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-xs"></span>
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          {/* <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarImage alt="User" />
                <AvatarFallback>
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger> */}
          <DropdownMenuTrigger asChild>
  <Button variant="ghost" className="relative h-8 w-8 rounded-full shrink-0">
    <Avatar className="h-8 w-8">
      <AvatarImage alt="User" />
      <AvatarFallback>
        {user ? (
          isAdminUser(user) ? (
            user.full_name
              .split(' ')
              .map(name => name[0])
              .join('')
              .toUpperCase()
          ) : (
            // `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
            // user.first_name
            "MR"
              
          )
        ) : (
          'U'
        )}
      </AvatarFallback>
    </Avatar>
  </Button>
</DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}