import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Users,
  Calendar,
  Target,
  TrendingUp,
  Package,
  DollarSign,
  Upload,
  X,
  Search,
  Network,
  ZoomIn
} from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ImageUpload } from "@/components/ImageUpload";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import organizationChartPlaceholder from "@/assets/organization-chart-placeholder.png";

interface Organization {
  id: string;
  name: string;
  type: 'b2b' | 'b2g';
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  tax_code: string | null;
  description: string | null;
  sales_stage: string;
  assigned_sales_person_id: string | null;
  logo_url: string | null;
  organization_chart_url: string | null;
  profiles?: {
    full_name: string;
  };
  organization_group_memberships?: {
    organization_groups: {
      id: string;
      name: string;
    };
  }[];
}

interface OrganizationRelationship {
  id: string;
  child_organization_id: string;
  relationship_type: 'child' | 'linked';
  organizations: {
    id: string;
    name: string;
    type: 'b2b' | 'b2g';
  };
}

interface KeyPersonnel {
  id: string;
  full_name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  notes: string | null;
  profiles?: {
    full_name: string;
  };
}

interface ContactHistory {
  id: string;
  personnel_id: string;
  contact_method: string;
  contact_date: string;
  summary: string;
  details: string | null;
  outcome: string | null;
  next_action: string | null;
  created_by: string;
  key_personnel: {
    full_name: string;
    position: string | null;
    avatar_url: string | null;
  };
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface SalesOpportunity {
  id: string;
  stage: string;
  negotiated_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product_name: string;
  sales_person_name?: string;
  stage_label: string;
  stage_color: string;
}

const OrganizationDetail = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const { setPageInfo } = usePageContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [keyPersonnel, setKeyPersonnel] = useState<KeyPersonnel[]>([]);
  const [contactHistory, setContactHistory] = useState<ContactHistory[]>([]);
  const [salesOpportunities, setSalesOpportunities] = useState<SalesOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [childOrganizations, setChildOrganizations] = useState<OrganizationRelationship[]>([]);
  const [linkedOrganizations, setLinkedOrganizations] = useState<OrganizationRelationship[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<{id: string, name: string, type: string}[]>([]);
  const [childOrgOpen, setChildOrgOpen] = useState(false);
  const [linkedOrgOpen, setLinkedOrgOpen] = useState(false);
  const [chartImageUrl, setChartImageUrl] = useState<string>("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);


  useEffect(() => {
    if (user && id) {
      fetchOrganization();
      fetchKeyPersonnel();
      fetchContactHistory();
      fetchSalesOpportunities();
      fetchOrganizationRelationships();
      fetchAllOrganizations();
    }
  }, [user, id]);

  const fetchOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          profiles:assigned_sales_person_id (
            full_name
          ),
          organization_group_memberships (
            organization_groups (
              id,
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrganization(data);
      setChartImageUrl(data?.organization_chart_url || "");
      
      // Set page info with organization name
      if (data) {
        setPageInfo(data.name, `Chi tiết thông tin khách hàng ${data.name}`);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin khách hàng",
        variant: "destructive",
      });
      navigate("/organizations");
    }
  };

  const fetchKeyPersonnel = async () => {
    try {
      const { data, error } = await supabase
        .from('key_personnel')
        .select(`
          *,
          profiles:assigned_sales_person_id (
            full_name
          )
        `)
        .eq('organization_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeyPersonnel(data || []);
      
      // Fetch contact history after getting key personnel
      if (data && data.length > 0) {
        fetchContactHistoryForPersonnel(data.map(p => p.id));
      }
    } catch (error) {
      console.error('Error fetching key personnel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContactHistoryForPersonnel = async (personnelIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('contact_history')
        .select(`
          *,
          key_personnel (
            full_name,
            position,
            avatar_url
          ),
          profiles:created_by (
            full_name,
            avatar_url
          )
        `)
        .in('personnel_id', personnelIds)
        .order('contact_date', { ascending: false });

      if (error) throw error;
      setContactHistory(data || []);
    } catch (error) {
      console.error('Error fetching contact history:', error);
    }
  };

  const fetchContactHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_history')
        .select(`
          *,
          key_personnel (
            full_name,
            position,
            avatar_url
          ),
          profiles:created_by (
            full_name,
            avatar_url
          )
        `)
        .in('personnel_id', keyPersonnel.map(p => p.id))
        .order('contact_date', { ascending: false });

      if (error) throw error;
      setContactHistory(data || []);
    } catch (error) {
      console.error('Error fetching contact history:', error);
    }
  };

  const fetchSalesOpportunities = async () => {
    try {
      // Fetch stages first
      const { data: stagesData } = await supabase
        .from('sales_funnel_stages')
        .select('stage_key, stage_label, stage_color')
        .eq('is_active', true);

      const stageMapping: {[key: string]: {label: string, color: string}} = {};
      stagesData?.forEach(stage => {
        stageMapping[stage.stage_key] = {
          label: stage.stage_label,
          color: stage.stage_color
        };
      });

      // Fetch sales opportunities
      const { data, error } = await supabase
        .from('sales_funnel')
        .select(`
          *,
          products(name),
          profiles(full_name)
        `)
        .eq('organization_id', id)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((item: any) => ({
        id: item.id,
        stage: item.stage,
        negotiated_price: item.negotiated_price,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        product_name: item.products?.name || '',
        sales_person_name: item.profiles?.full_name || undefined,
        stage_label: stageMapping[item.stage]?.label || item.stage,
        stage_color: stageMapping[item.stage]?.color || 'secondary',
      }));

      setSalesOpportunities(formattedData);
    } catch (error) {
      console.error('Error fetching sales opportunities:', error);
    }
  };

  const getSalesStageColor = (stage: string) => {
    const colors = {
      prospect: "bg-gray-100 text-gray-800",
      qualified: "bg-blue-100 text-blue-800", 
      proposal: "bg-yellow-100 text-yellow-800",
      negotiation: "bg-orange-100 text-orange-800",
      closed_won: "bg-green-100 text-green-800",
      closed_lost: "bg-red-100 text-red-800"
    };
    return colors[stage as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getSalesStageText = (stage: string) => {
    const texts = {
      prospect: "Tiềm năng",
      qualified: "Đã đủ điều kiện", 
      proposal: "Đề xuất",
      negotiation: "Đàm phán",
      closed_won: "Thành công",
      closed_lost: "Thất bại"
    };
    return texts[stage as keyof typeof texts] || stage;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isContactInFuture = (contactDate: string) => {
    return new Date(contactDate) > new Date();
  };

  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'social_media': return <Target className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getContactMethodLabel = (method: string) => {
    switch (method) {
      case 'phone': return 'Điện thoại';
      case 'email': return 'Email';
      case 'meeting': return 'Gặp mặt';
      case 'social_media': return 'Mạng xã hội';
      default: return 'Khác';
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Chưa thương thảo";
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const fetchOrganizationRelationships = async () => {
    try {
      // Get relationships where current org is parent
      const { data: asParentData, error: asParentError } = await supabase
        .from('organization_relationships')
        .select('id, child_organization_id, relationship_type')
        .eq('parent_organization_id', id);

      if (asParentError) throw asParentError;

      // Get relationships where current org is child (for 2-way linked relationships and parent orgs)
      const { data: asChildData, error: asChildError } = await supabase
        .from('organization_relationships')
        .select('id, parent_organization_id, relationship_type')
        .eq('child_organization_id', id);

      if (asChildError) throw asChildError;

      // Collect all related organization IDs
      const childOrgIds = asParentData?.filter(rel => rel.relationship_type === 'child').map(rel => rel.child_organization_id) || [];
      const linkedOrgIds = [
        ...(asParentData?.filter(rel => rel.relationship_type === 'linked').map(rel => rel.child_organization_id) || []),
        ...(asChildData?.filter(rel => rel.relationship_type === 'linked').map(rel => rel.parent_organization_id) || []),
        ...(asChildData?.filter(rel => rel.relationship_type === 'child').map(rel => rel.parent_organization_id) || [])
      ];

      // Remove duplicates from linked organizations
      const uniqueLinkedOrgIds = [...new Set(linkedOrgIds)];

      // Get organization details for all related orgs
      const allOrgIds = [...childOrgIds, ...uniqueLinkedOrgIds].filter(Boolean);
      
      if (allOrgIds.length === 0) {
        setChildOrganizations([]);
        setLinkedOrganizations([]);
        return;
      }

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, type')
        .in('id', allOrgIds);

      if (orgError) throw orgError;

      // Format child organizations
      const childOrgs = asParentData?.filter(rel => rel.relationship_type === 'child').map(rel => {
        const org = orgData?.find(o => o.id === rel.child_organization_id);
        return {
          id: rel.id,
          child_organization_id: rel.child_organization_id,
          relationship_type: rel.relationship_type as 'child' | 'linked',
          organizations: org || { id: '', name: 'Không tìm thấy', type: 'b2b' as const }
        };
      }) || [];

      // Format linked organizations (combining all sources)
      const linkedOrgs: any[] = [];

      // Add linked orgs where current org is parent
      asParentData?.filter(rel => rel.relationship_type === 'linked').forEach(rel => {
        const org = orgData?.find(o => o.id === rel.child_organization_id);
        if (org) {
          linkedOrgs.push({
            id: rel.id,
            child_organization_id: rel.child_organization_id,
            relationship_type: rel.relationship_type as 'child' | 'linked',
            organizations: org
          });
        }
      });

      // Add linked orgs where current org is child (2-way relationship)
      asChildData?.filter(rel => rel.relationship_type === 'linked').forEach(rel => {
        const org = orgData?.find(o => o.id === rel.parent_organization_id);
        if (org && !linkedOrgs.some(lo => lo.organizations.id === org.id)) {
          linkedOrgs.push({
            id: rel.id,
            child_organization_id: rel.parent_organization_id,
            relationship_type: 'linked' as 'child' | 'linked',
            organizations: org
          });
        }
      });

      // Add parent orgs (if current org is a child)
      asChildData?.filter(rel => rel.relationship_type === 'child').forEach(rel => {
        const org = orgData?.find(o => o.id === rel.parent_organization_id);
        if (org && !linkedOrgs.some(lo => lo.organizations.id === org.id)) {
          linkedOrgs.push({
            id: rel.id,
            child_organization_id: rel.parent_organization_id,
            relationship_type: 'linked' as 'child' | 'linked',
            organizations: org
          });
        }
      });

      setChildOrganizations(childOrgs);
      setLinkedOrganizations(linkedOrgs);
    } catch (error) {
      console.error('Error fetching organization relationships:', error);
    }
  };

  const fetchAllOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, type')
        .neq('id', id)
        .order('name');

      if (error) throw error;
      setAllOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching all organizations:', error);
    }
  };

  const addOrganizationRelationship = async (childOrgId: string, relationshipType: 'child' | 'linked') => {
    try {
      const { error } = await supabase
        .from('organization_relationships')
        .insert({
          parent_organization_id: id,
          child_organization_id: childOrgId,
          relationship_type: relationshipType
        });

      if (error) throw error;
      
      toast({
        title: "Thành công",
        description: `Đã thêm tổ chức ${relationshipType === 'child' ? 'con' : 'liên kết'}`,
      });
      
      fetchOrganizationRelationships();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm mối quan hệ tổ chức",
        variant: "destructive",
      });
    }
  };

  const removeOrganizationRelationship = async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from('organization_relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;
      
      toast({
        title: "Thành công",
        description: "Đã xóa mối quan hệ tổ chức",
      });
      
      fetchOrganizationRelationships();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa mối quan hệ tổ chức",
        variant: "destructive",
      });
    }
  };

  const updateOrganizationChart = async (url: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ organization_chart_url: url })
        .eq('id', id);

      if (error) throw error;
      
      setChartImageUrl(url);
      toast({
        title: "Thành công",
        description: "Đã cập nhật sơ đồ tổ chức",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật sơ đồ tổ chức",
        variant: "destructive",
      });
    }
  };

  if (loading || isLoading || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Đang tải...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/organizations">Khách hàng & Đối tác</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{organization.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button onClick={() => navigate(`/organizations/${id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Chỉnh sửa
        </Button>
      </div>
      <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="personnel">Nhân sự key</TabsTrigger>
            <TabsTrigger value="opportunities">Cơ hội bán hàng</TabsTrigger>
            <TabsTrigger value="activities">Hoạt động</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Organization Info */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Thông tin tổ chức
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Organization Logo */}
                    <div className="flex items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
                      <div className="flex-shrink-0">
                        {organization.logo_url ? (
                          <img
                            src={organization.logo_url}
                            alt={`${organization.name} logo`}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{organization.name}</h3>
                        <p className="text-muted-foreground">
                          {organization.type === 'b2b' ? 'Doanh nghiệp B2B' : 'Doanh nghiệp B2G'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Loại doanh nghiệp</label>
                        <div className="mt-1">
                          <Badge variant="outline" className={organization.type === 'b2b' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
                            {organization.type === 'b2b' ? 'B2B' : 'B2G'}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Trạng thái bán hàng</label>
                        <div className="mt-1">
                          <Badge className={getSalesStageColor(organization.sales_stage)}>
                            {getSalesStageText(organization.sales_stage)}
                          </Badge>
                        </div>
                      </div>

                      {organization.organization_group_memberships && organization.organization_group_memberships.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Nhóm khách hàng</label>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {organization.organization_group_memberships.map((membership) => (
                              <Badge 
                                key={membership.organization_groups.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {membership.organization_groups.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {organization.tax_code && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Mã số thuế</label>
                          <p className="text-sm">{organization.tax_code}</p>
                        </div>
                      )}
                    </div>

                    {organization.address && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Địa chỉ
                        </label>
                        <p className="text-sm">{organization.address}</p>
                      </div>
                    )}

                    {organization.description && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Mô tả</label>
                        <p className="text-sm">{organization.description}</p>
                      </div>
                    )}
                   </CardContent>
                 </Card>

                  {/* Organization Chart */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5" />
                        Sơ đồ tổ chức
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative group">
                        <img 
                          src={chartImageUrl || organizationChartPlaceholder} 
                          alt="Sơ đồ tổ chức" 
                          className="w-full h-80 object-contain rounded-lg border bg-muted/20 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setShowUploadDialog(true)}
                        />
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ZoomIn className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                            <img 
                              src={chartImageUrl || organizationChartPlaceholder} 
                              alt="Sơ đồ tổ chức - Kích thước gốc" 
                              className="w-full h-auto"
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cập nhật sơ đồ tổ chức</DialogTitle>
                          </DialogHeader>
                          <ImageUpload
                            label=""
                            value={chartImageUrl}
                            onChange={(url) => {
                              updateOrganizationChart(url);
                              setShowUploadDialog(false);
                            }}
                            placeholder="Chọn ảnh sơ đồ tổ chức"
                          />
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>

                 {/* Child Organizations */}
                 <Card className="mt-6">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Building2 className="h-5 w-5" />
                       Tổ chức con
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="flex items-center gap-2">
                       <Popover open={childOrgOpen} onOpenChange={setChildOrgOpen}>
                         <PopoverTrigger asChild>
                           <Button variant="outline" className="w-full justify-start">
                             <Plus className="h-4 w-4 mr-2" />
                             Thêm tổ chức con
                           </Button>
                         </PopoverTrigger>
                         <PopoverContent className="w-80 p-0" align="start">
                           <Command>
                             <CommandInput placeholder="Tìm kiếm tổ chức..." />
                             <CommandList>
                               <CommandEmpty>Không tìm thấy tổ chức nào.</CommandEmpty>
                               <CommandGroup>
                                 {allOrganizations
                                   .filter(org => !childOrganizations.some(child => child.child_organization_id === org.id))
                                   .filter(org => !linkedOrganizations.some(linked => linked.child_organization_id === org.id))
                                   .map((org) => (
                                   <CommandItem
                                     key={org.id}
                                     value={org.name}
                                     onSelect={() => {
                                       addOrganizationRelationship(org.id, 'child');
                                       setChildOrgOpen(false);
                                     }}
                                   >
                                     <Building2 className="h-4 w-4 mr-2" />
                                     <div>
                                       <div>{org.name}</div>
                                       <div className="text-xs text-muted-foreground">
                                         {org.type === 'b2b' ? 'B2B' : 'B2G'}
                                       </div>
                                     </div>
                                   </CommandItem>
                                 ))}
                               </CommandGroup>
                             </CommandList>
                           </Command>
                         </PopoverContent>
                       </Popover>
                     </div>
                     
                      {childOrganizations.length > 0 ? (
                        <div className="space-y-2">
                          {childOrganizations.map((relationship) => (
                            <div key={relationship.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                              <div 
                                className="flex items-center gap-3 cursor-pointer flex-1"
                                onClick={() => navigate(`/organizations/${relationship.organizations.id}`)}
                              >
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium text-primary hover:underline">{relationship.organizations.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {relationship.organizations.type === 'b2b' ? 'B2B' : 'B2G'}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeOrganizationRelationship(relationship.id);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                     ) : (
                       <div className="text-center py-6 text-muted-foreground">
                         <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                         <p className="text-sm">Chưa có tổ chức con nào</p>
                       </div>
                     )}
                   </CardContent>
                 </Card>

                 {/* Linked Organizations */}
                 <Card className="mt-6">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Network className="h-5 w-5" />
                       Tổ chức liên kết
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="flex items-center gap-2">
                       <Popover open={linkedOrgOpen} onOpenChange={setLinkedOrgOpen}>
                         <PopoverTrigger asChild>
                           <Button variant="outline" className="w-full justify-start">
                             <Plus className="h-4 w-4 mr-2" />
                             Thêm tổ chức liên kết
                           </Button>
                         </PopoverTrigger>
                         <PopoverContent className="w-80 p-0" align="start">
                           <Command>
                             <CommandInput placeholder="Tìm kiếm tổ chức..." />
                             <CommandList>
                               <CommandEmpty>Không tìm thấy tổ chức nào.</CommandEmpty>
                               <CommandGroup>
                                 {allOrganizations
                                   .filter(org => !childOrganizations.some(child => child.child_organization_id === org.id))
                                   .filter(org => !linkedOrganizations.some(linked => linked.child_organization_id === org.id))
                                   .map((org) => (
                                   <CommandItem
                                     key={org.id}
                                     value={org.name}
                                     onSelect={() => {
                                       addOrganizationRelationship(org.id, 'linked');
                                       setLinkedOrgOpen(false);
                                     }}
                                   >
                                     <Network className="h-4 w-4 mr-2" />
                                     <div>
                                       <div>{org.name}</div>
                                       <div className="text-xs text-muted-foreground">
                                         {org.type === 'b2b' ? 'B2B' : 'B2G'}
                                       </div>
                                     </div>
                                   </CommandItem>
                                 ))}
                               </CommandGroup>
                             </CommandList>
                           </Command>
                         </PopoverContent>
                       </Popover>
                     </div>
                     
                      {linkedOrganizations.length > 0 ? (
                        <div className="space-y-2">
                          {linkedOrganizations.map((relationship) => (
                            <div key={relationship.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                              <div 
                                className="flex items-center gap-3 cursor-pointer flex-1"
                                onClick={() => navigate(`/organizations/${relationship.organizations.id}`)}
                              >
                                <Network className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium text-primary hover:underline">{relationship.organizations.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {relationship.organizations.type === 'b2b' ? 'B2B' : 'B2G'}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeOrganizationRelationship(relationship.id);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                     ) : (
                       <div className="text-center py-6 text-muted-foreground">
                         <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
                         <p className="text-sm">Chưa có tổ chức liên kết nào</p>
                       </div>
                     )}
                   </CardContent>
                 </Card>
               </div>

              {/* Contact & Sales Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin liên hệ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {organization.email ? (
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Mail className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{organization.email}</p>
                        </div>
                      </div>
                    ) : null}

                    {organization.phone ? (
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Phone className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Điện thoại</p>
                          <p className="text-sm text-muted-foreground">{organization.phone}</p>
                        </div>
                      </div>
                    ) : null}

                    {organization.website ? (
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Globe className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Website</p>
                          <p className="text-sm text-muted-foreground">{organization.website}</p>
                        </div>
                      </div>
                    ) : null}

                    {!organization.email && !organization.phone && !organization.website && (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">Chưa có thông tin liên hệ</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin bán hàng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {organization.profiles && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nhân viên phụ trách</label>
                        <p className="text-sm">{organization.profiles.full_name}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="personnel" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Nhân sự quan trọng</h3>
                <p className="text-sm text-muted-foreground">
                  Danh sách các nhân sự key cần chăm sóc của tổ chức
                </p>
              </div>
              <Button onClick={() => navigate(`/key-personnel/new?organization=${id}`)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm nhân sự
              </Button>
            </div>

            {keyPersonnel.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {keyPersonnel.map((person) => (
                  <Card 
                    key={person.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/key-personnel/${person.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={person.avatar_url || ""} />
                          <AvatarFallback>
                            {getInitials(person.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{person.full_name}</h4>
                          {person.position && (
                            <p className="text-sm text-muted-foreground truncate">{person.position}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {person.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{person.email}</span>
                        </div>
                      )}
                      {person.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{person.phone}</span>
                        </div>
                      )}
                      {person.profiles && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Phụ trách: {person.profiles.full_name}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chưa có nhân sự nào</h3>
                <p className="text-muted-foreground mb-4">
                  Bắt đầu bằng cách thêm nhân sự quan trọng đầu tiên
                </p>
                <Button onClick={() => navigate(`/key-personnel/new?organization=${id}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm nhân sự
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Các cơ hội bán hàng</h3>
                <p className="text-sm text-muted-foreground">
                  Danh sách các cơ hội bán hàng trong phễu bán hàng của tổ chức này
                </p>
              </div>
              <Button onClick={() => navigate("/sales-funnel/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo cơ hội mới
              </Button>
            </div>

            {salesOpportunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesOpportunities.map((opportunity) => (
                  <Card 
                    key={opportunity.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/sales-funnel/${opportunity.id}/history`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-semibold truncate">{opportunity.product_name}</h4>
                        </div>
                        <Badge variant={opportunity.stage_color as any}>
                          {opportunity.stage_label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(opportunity.stage === "negotiation" || opportunity.stage === "closed_won" || opportunity.negotiated_price) && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatPrice(opportunity.negotiated_price)}</span>
                        </div>
                      )}
                      
                      {opportunity.sales_person_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Phụ trách: {opportunity.sales_person_name}</span>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Cập nhật: {formatDate(opportunity.updated_at)}
                      </div>
                      
                      {opportunity.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {opportunity.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chưa có cơ hội bán hàng nào</h3>
                <p className="text-muted-foreground mb-4">
                  Bắt đầu bằng cách tạo cơ hội bán hàng đầu tiên cho tổ chức này
                </p>
                <Button onClick={() => navigate("/sales-funnel/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo cơ hội
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Hoạt động chăm sóc</h3>
              <p className="text-sm text-muted-foreground">
                Lịch sử và kế hoạch chăm sóc các nhân sự key của tổ chức
              </p>
            </div>

            {contactHistory.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Chưa có hoạt động chăm sóc</h3>
                  <p className="text-muted-foreground mb-4 text-center">
                    Chưa có lịch sử chăm sóc nào cho các nhân sự key của tổ chức này
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {contactHistory.map((contact) => {
                  const isFuture = isContactInFuture(contact.contact_date);
                  return (
                    <Card 
                      key={contact.id} 
                      className={`hover:shadow-md transition-shadow border-l-4 ${
                        isFuture 
                          ? "border-l-primary bg-primary/5" 
                          : "border-l-muted bg-background"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={contact.key_personnel.avatar_url || ""} />
                              <AvatarFallback>
                                {getInitials(contact.key_personnel.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{contact.key_personnel.full_name}</h4>
                              {contact.key_personnel.position && (
                                <p className="text-sm text-muted-foreground">{contact.key_personnel.position}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 mb-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(contact.contact_date)}
                              {isFuture && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Tương lai
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getContactMethodIcon(contact.contact_method)}
                              <span className="ml-1">{getContactMethodLabel(contact.contact_method)}</span>
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Sales Person Info */}
                        {contact.profiles && (
                          <div className="flex items-center gap-2 text-sm">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={contact.profiles.avatar_url || ""} />
                              <AvatarFallback className="text-xs">
                                {getInitials(contact.profiles.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground">
                              Phụ trách bởi: {contact.profiles.full_name}
                            </span>
                          </div>
                        )}

                        {/* Summary */}
                        <div>
                          <h5 className="font-medium text-sm mb-1">Tóm tắt</h5>
                          <p className="text-sm">{contact.summary}</p>
                        </div>

                        {/* Details */}
                        {contact.details && (
                          <div>
                            <h5 className="font-medium text-sm mb-1">Chi tiết</h5>
                            <p className="text-sm text-muted-foreground">{contact.details}</p>
                          </div>
                        )}

                        {/* Outcome */}
                        {contact.outcome && (
                          <div>
                            <h5 className="font-medium text-sm mb-1">Kết quả</h5>
                            <p className="text-sm text-muted-foreground">{contact.outcome}</p>
                          </div>
                        )}

                        {/* Next Action */}
                        {contact.next_action && (
                          <div>
                            <h5 className="font-medium text-sm mb-1">Hành động tiếp theo</h5>
                            <p className="text-sm text-muted-foreground">{contact.next_action}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default OrganizationDetail;
