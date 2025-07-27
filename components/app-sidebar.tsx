// "use client";

// import {
//   BarChart3,
//   Building2,
//   FileText,
//   Home,
//   LogOut,
//   Settings,
//   Target,
//   Users,
// } from "lucide-react";
// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { useAuthStore } from "@/store/authStore";

// import {
//   Sidebar,
//   SidebarContent,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarHeader,
// } from "@/components/ui/sidebar";

// const adminMenuItems = [
//   {
//     title: "Dashboard",
//     url: "/",
//     icon: Home,
//   },
//   {
//     title: "Employees",
//     url: "/employees",
//     icon: Users,
//   },
//   {
//     title: "Reviews",
//     url: "/reviews",
//     icon: FileText,
//   },
//   {
//     title: "Goals",
//     url: "/goals",
//     icon: Target,
//   },
//   {
//     title: "Reports",
//     url: "/reports",
//     icon: BarChart3,
//   },
//   {
//     title: "Settings",
//     url: "/settings",
//     icon: Settings,
//   },
//   {
//     title: "Author",
//     url: "/author",
//     icon: Settings,
//   },
// ];

// const managerMenuItems = [
//   {
//     title: "Dashboard",
//     url: "/",
//     icon: Home,
//   },
//   {
//     title: "Settings",
//     url: "/settings",
//     icon: Settings,
//   },
//   {
//     title: "Author",
//     url: "/author",
//     icon: Settings,
//   },
// ];

// export function AppSidebar() {
//   const pathname = usePathname();
//   const router = useRouter();
//   const { user, logout } = useAuthStore();
  
//   // Determine which menu items to show based on user role
//   const menuItems = user?.role === 'admin' ? adminMenuItems : managerMenuItems;

//   const handleLogout = async () => {
//     try {
//       logout(); // Clear client-side state
//       router.push("/login"); // Redirect to login page
//     } catch (error) {
//       console.error("Logout failed:", error);
//     }
//   };

//   return (
//     <Sidebar className="border-r">
//       <SidebarHeader className="p-6">
//         <div className="flex items-center gap-2">
//           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
//             <Building2 className="h-4 w-4" />
//           </div>
//           <div className="flex flex-col">
//             <span className="text-sm font-semibold">Performance</span>
//             <span className="text-xs text-muted-foreground">Tracker</span>
//           </div>
//         </div>
//       </SidebarHeader>
//       <SidebarContent>
//         <SidebarGroup>
//           <SidebarGroupContent>
//             <SidebarMenu>
//               {menuItems.map((item) => (
//                 <SidebarMenuItem key={item.title}>
//                   <SidebarMenuButton asChild isActive={pathname === item.url}>
//                     <Link href={item.url}>
//                       <item.icon className="h-4 w-4" />
//                       <span>{item.title}</span>
//                     </Link>
//                   </SidebarMenuButton>
//                 </SidebarMenuItem>
//               ))}
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>

//         <SidebarGroup className="mt-auto">
//           <SidebarGroupContent>
//             <SidebarMenu>
//               <SidebarMenuItem>
//                 <SidebarMenuButton onClick={handleLogout} className="justify-center">
//                   <LogOut className="h-4 w-4" />
//                   <span>Logout</span>
//                 </SidebarMenuButton>
//               </SidebarMenuItem>
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>
//       </SidebarContent>
//     </Sidebar>
//   );
// }








"use client";

import {
  BarChart3,
  Building2,
  FileText,
  Home,
  LogOut,
  Settings,
  Target,
  Users,
  Medal,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Users,
  },
  {
    title: "Reviews",
    url: "/reviews",
    icon: FileText,
  },
  {
    title: "Goals",
    url: "/goals",
    icon: Target,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Author",
    url: "/author",
    icon: Medal,
  },
];

const managerMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Author",
    url: "/author",
    icon: Medal,
  },
];

// Define which roles can access which paths
const rolePermissions = {
  admin: [
    "/dashboard",
    "/employees",
    "/reviews",
    "/goals",
    "/reports",
    "/settings",
    "/author",
  ],
  manager: [
    "/dashboard",
    "/settings",
    "/author",
  ],
};

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Check if current path is allowed for the user's role
  useEffect(() => {
    if (!user) return;

    const allowedPaths = rolePermissions[user.role as keyof typeof rolePermissions] || [];
    const isPathAllowed = allowedPaths.some(allowedPath => 
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`)
    );

    if (!isPathAllowed) {
      router.push("/unauthorized");
    }
  }, [pathname, user, router]);

  // Determine which menu items to show based on user role
  const menuItems = user?.role === 'admin' ? adminMenuItems : managerMenuItems;

  const handleLogout = async () => {
    try {
      await logout(); // Clear client-side state
      router.push("/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Performance</span>
            <span className="text-xs text-muted-foreground">Tracker</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="justify-center">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}