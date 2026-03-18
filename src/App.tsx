import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppLayout } from "@/components/AppLayout";
import { PageProvider } from "@/contexts/PageContext";
import Auth from "./pages/Auth";
import Organizations from "./pages/Organizations";
import OrganizationForm from "./pages/OrganizationForm";
import OrganizationDetail from "./pages/OrganizationDetail";
import OrganizationGroups from "./pages/OrganizationGroups";
import OrganizationGroupForm from "./pages/OrganizationGroupForm";
import KeyPersonnel from "./pages/KeyPersonnel";
import KeyPersonnelForm from "./pages/KeyPersonnelForm";
import KeyPersonnelDetail from "./pages/KeyPersonnelDetail";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import CategoryForm from "./pages/CategoryForm";
import SalesFunnel from "./pages/SalesFunnel";
import SalesFunnelForm from "./pages/SalesFunnelForm";
import SalesFunnelHistory from "./pages/SalesFunnelHistory";
import SalesFunnelStages from "./pages/SalesFunnelStages";
import SalesTeam from "./pages/SalesTeam";
import SalesTeamForm from "./pages/SalesTeamForm";
import Collaborators from "./pages/Collaborators";
import CollaboratorForm from "./pages/CollaboratorForm";
import CareSchedule from "./pages/CareSchedule";
import CareScheduleForm from "./pages/CareScheduleForm";
import SystemConfiguration from "./pages/SystemConfiguration";
import PersonnelFieldsConfig from "./pages/PersonnelFieldsConfig";
import OrganizationFieldsConfig from "./pages/OrganizationFieldsConfig";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/*" element={
            <SidebarProvider>
              <PageProvider>
                <div className="min-h-screen flex w-full">
                  <AppLayout>
                    <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/organizations" element={<Organizations />} />
                    <Route path="/organizations/new" element={<OrganizationForm />} />
                    <Route path="/organizations/:id" element={<OrganizationDetail />} />
                    <Route path="/organizations/:id/edit" element={<OrganizationForm />} />
                    <Route path="/organization-groups" element={<OrganizationGroups />} />
                    <Route path="/organization-groups/new" element={<OrganizationGroupForm />} />
                    <Route path="/organization-groups/:id/edit" element={<OrganizationGroupForm />} />
                    <Route path="/key-personnel" element={<KeyPersonnel />} />
                    <Route path="/key-personnel/new" element={<KeyPersonnelForm />} />
                    <Route path="/key-personnel/:id" element={<KeyPersonnelDetail />} />
                    <Route path="/key-personnel/:id/edit" element={<KeyPersonnelForm />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/new" element={<ProductForm />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/products/:id/edit" element={<ProductForm />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/categories/new" element={<CategoryForm />} />
                    <Route path="/categories/:id/edit" element={<CategoryForm />} />
                    <Route path="/sales-funnel" element={<SalesFunnel />} />
                    <Route path="/sales-funnel/new" element={<SalesFunnelForm />} />
                    <Route path="/sales-funnel/:id/edit" element={<SalesFunnelForm />} />
                    <Route path="/sales-funnel/:id/history" element={<SalesFunnelHistory />} />
                    <Route path="/sales-funnel/stages" element={<SalesFunnelStages />} />
                     <Route path="/sales-team" element={<SalesTeam />} />
                     <Route path="/sales-team/new" element={<SalesTeamForm />} />
                     <Route path="/collaborators" element={<Collaborators />} />
                     <Route path="/collaborators/new" element={<CollaboratorForm />} />
                     <Route path="/collaborators/:id/edit" element={<CollaboratorForm />} />
                    <Route path="/care-schedule" element={<CareSchedule />} />
                    <Route path="/care-schedule/new" element={<CareScheduleForm />} />
                    <Route path="/care-schedule/:id/edit" element={<CareScheduleForm />} />
                     <Route path="/system-configuration" element={<SystemConfiguration />} />
          <Route path="/personnel-fields-config" element={<PersonnelFieldsConfig />} />
          <Route path="/organization-fields-config" element={<OrganizationFieldsConfig />} />
                     <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </div>
              </PageProvider>
            </SidebarProvider>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
