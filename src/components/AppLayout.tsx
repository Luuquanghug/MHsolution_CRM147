
import { useEffect } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { APP_CONFIG, ROUTES } from "@/config/app";
import { menuItems, adminMenuItems } from "@/config/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useRole();
  const { title, description } = usePageContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, setOpen, isMobile, setOpenMobile } = useSidebar();


  useEffect(() => {
    if (!loading && !user) {
      navigate(ROUTES.auth);
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Đang tải...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleMenuClick = () => {
    // Close sidebar on mobile when clicking a menu item
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <Sidebar className={state === "collapsed" ? "w-14" : "w-64"} collapsible="icon">
        <SidebarHeader className="border-b border-border">
          <div className="p-4 flex items-center justify-between">
            <div className="flex-1">
              <h1 className={`text-xl font-bold text-primary transition-all ${state === "collapsed" ? "hidden" : "block"}`}>
                {APP_CONFIG.name}
              </h1>
              {state === "collapsed" && (
                <div className="text-lg font-bold text-primary">{APP_CONFIG.shortName}</div>
              )}
            </div>
            <SidebarTrigger className="md:hidden" />
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className={state === "collapsed" && !isMobile ? "sr-only" : ""}>
              Chức năng chính
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item: any) => {
                  if (item.subItems) {
                    return (
                      <Collapsible key={item.url} asChild defaultOpen>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild tooltip={state === "collapsed" ? item.title : undefined}>
                            <CollapsibleTrigger>
                              <item.icon className="h-4 w-4" />
                              <span className={state === "collapsed" && !isMobile ? "sr-only" : ""}>{item.title}</span>
                              <ChevronDown className={`ml-auto h-4 w-4 transition-transform duration-200 ${state === "collapsed" && !isMobile ? "sr-only" : ""}`} />
                            </CollapsibleTrigger>
                          </SidebarMenuButton>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.subItems.map((subItem: any) => (
                                <SidebarMenuSubItem key={subItem.url}>
                                  <SidebarMenuSubButton asChild isActive={isActive(subItem.url)}>
                                    <NavLink to={subItem.url} onClick={handleMenuClick}>
                                      <span>{subItem.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)}
                        tooltip={state === "collapsed" ? item.title : undefined}
                      >
                        <NavLink to={item.url} onClick={handleMenuClick}>
                          <item.icon className="h-4 w-4" />
                          <span className={state === "collapsed" && !isMobile ? "sr-only" : ""}>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel className={state === "collapsed" && !isMobile ? "sr-only" : ""}>
                Quản trị
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMenuItems.map((item: any) => {
                    if (item.subItems) {
                      return (
                        <Collapsible key={item.url} asChild defaultOpen>
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip={state === "collapsed" ? item.title : undefined}>
                              <CollapsibleTrigger>
                                <item.icon className="h-4 w-4" />
                                <span className={state === "collapsed" && !isMobile ? "sr-only" : ""}>{item.title}</span>
                                <ChevronDown className={`ml-auto h-4 w-4 transition-transform duration-200 ${state === "collapsed" && !isMobile ? "sr-only" : ""}`} />
                              </CollapsibleTrigger>
                            </SidebarMenuButton>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.subItems.map((subItem: any) => (
                                  <SidebarMenuSubItem key={subItem.url}>
                                    <SidebarMenuSubButton asChild isActive={isActive(subItem.url)}>
                                      <NavLink to={subItem.url} onClick={handleMenuClick}>
                                        <span>{subItem.title}</span>
                                      </NavLink>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive(item.url)}
                          tooltip={state === "collapsed" ? item.title : undefined}
                        >
                          <NavLink to={item.url} onClick={handleMenuClick}>
                            <item.icon className="h-4 w-4" />
                            <span className={state === "collapsed" && !isMobile ? "sr-only" : ""}>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
        
        <SidebarFooter className="border-t border-border">
          <div className="p-4 space-y-2">
            <div className={`text-sm text-muted-foreground transition-all ${state === "collapsed" && !isMobile ? "sr-only" : "block"}`}>
              Xin chào, {user.email}
            </div>
            <Button 
              variant="outline" 
              size={state === "collapsed" ? "icon" : "sm"}
              onClick={signOut}
              className="w-full"
            >
              <LogOut className="h-4 w-4" />
              <span className={state === "collapsed" ? "sr-only" : "ml-2"}>Đăng xuất</span>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 sm:h-20 shrink-0 items-center gap-2 sm:gap-4 border-b border-border px-3 sm:px-4">
          <SidebarTrigger />
          <div className="flex-1 min-w-0">
            {title && (
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{title}</h1>
                {description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">{description}</p>
                )}
              </div>
            )}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground hidden md:block">
            {user.email}
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
