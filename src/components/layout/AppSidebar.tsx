import { useState } from "react"
import { BarChart3, Users, CreditCard, DollarSign, Monitor, LogOut, Menu, Settings, FileText, Wrench } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const menuItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Clientes", url: "/clients", icon: Users },
  { title: "Planos", url: "/plans", icon: CreditCard },
  { title: "Financeiro", url: "/financial", icon: DollarSign },
  { title: "Acesso Remoto", url: "/remote-access", icon: Monitor },
  { title: "Relatórios Técnicos", url: "/technical-reports", icon: FileText },
  { title: "Revisão Técnica", url: "/technical-review", icon: Wrench },
]

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const currentPath = location.pathname
  const { user, signOut } = useAuth()

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-gradient-primary text-primary-foreground shadow-glow" : "hover:bg-secondary/50 hover:text-secondary-foreground"

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} transition-smooth border-r border-border shadow-elegant`}
    >
      <SidebarHeader className="p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Monitor className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Gerenciador</h2>
              <p className="text-xs text-muted-foreground">Online Manager</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
            <Monitor className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Módulos
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={`flex items-center gap-3 p-3 rounded-lg transition-smooth ${getNavCls({ isActive: isActive(item.url) })}`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex flex-col gap-2">
          {!collapsed && (
            <div className="text-xs text-muted-foreground mb-2">
              <p>Usuário: {user?.email?.split('@')[0]}</p>
              <p>Versão: 1.0.0</p>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}