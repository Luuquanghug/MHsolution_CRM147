import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Building2, Mail, Phone, Globe } from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Organization {
  id: string;
  name: string;
  type: 'b2b' | 'b2g';
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  tax_code: string | null;
  sales_stage: string;
  assigned_sales_person_id: string | null;
  logo_url: string | null;
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

const Organizations = () => {
  const { user, loading } = useAuth();
  const { setPageInfo } = usePageContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageInfo("Quản lý Khách hàng & Đối tác", "Quản lý các khách hàng và đối tác B2B và B2G");
  }, [setPageInfo]);


  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  const fetchOrganizations = async () => {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách khách hàng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  let filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.organization_group_memberships?.some(membership =>
      membership.organization_groups.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (customerTypeFilter !== "all") {
    filteredOrganizations = filteredOrganizations.filter(org => org.type === customerTypeFilter);
  }

  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrganizations = filteredOrganizations.slice(startIndex, startIndex + itemsPerPage);

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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Đang tải...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Khách hàng & Đối tác</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button 
          onClick={() => navigate("/organizations/new")} 
          className="shrink-0 self-start px-3 sm:self-auto sm:px-4"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Thêm người dùng mới
        </Button>
      </div>
      {/* Search and Filters */}
      <div className="space-y-4 sm:space-y-0 sm:flex sm:gap-4 sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Lọc theo loại khách hàng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại khách hàng</SelectItem>
              <SelectItem value="b2b">B2B</SelectItem>
              <SelectItem value="b2g">B2G</SelectItem>
            </SelectContent>
          </Select>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => {
            setItemsPerPage(Number(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / trang</SelectItem>
              <SelectItem value="25">25 / trang</SelectItem>
              <SelectItem value="50">50 / trang</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Khách hàng</TableHead>
              <TableHead className="min-w-[80px]">Loại</TableHead>
              <TableHead className="min-w-[120px] hidden sm:table-cell">Nhóm khách hàng</TableHead>
              <TableHead className="min-w-[120px] hidden md:table-cell">Liên hệ</TableHead>
              <TableHead className="min-w-[120px]">Trạng thái bán hàng</TableHead>
              <TableHead className="min-w-[100px] hidden lg:table-cell">Phụ trách</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrganizations.map((org) => (
              <TableRow 
                key={org.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/organizations/${org.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {org.logo_url ? (
                      <img 
                        src={org.logo_url} 
                        alt={`${org.name} logo`}
                        className="h-4 w-4 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Building2 className={`h-4 w-4 text-primary ${org.logo_url ? 'hidden' : ''}`} />
                    <div>
                      <div className="font-medium text-sm sm:text-base truncate">{org.name}</div>
                      {org.address && (
                        <div className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-xs">
                          {org.address}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={org.type === 'b2b' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
                    {org.type === 'b2b' ? 'B2B' : 'B2G'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">
                  <div className="flex flex-wrap gap-1">
                    {org.organization_group_memberships?.length ? (
                      org.organization_group_memberships.map((membership) => (
                        <Badge 
                          key={membership.organization_groups.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {membership.organization_groups.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="space-y-1">
                    {org.email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-32">{org.email}</span>
                      </div>
                    )}
                    {org.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{org.phone}</span>
                      </div>
                    )}
                    {org.website && (
                      <div className="flex items-center gap-1 text-sm">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-32">{org.website}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getSalesStageColor(org.sales_stage)}>
                    {getSalesStageText(org.sales_stage)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  {org.profiles?.full_name || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredOrganizations.length)} trong tổng số {filteredOrganizations.length} khách hàng
          </div>
          <Pagination>
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(currentPage - 1);
                    }}
                  />
                </PaginationItem>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(currentPage + 1);
                    }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {filteredOrganizations.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || customerTypeFilter !== "all" ? "Không tìm thấy khách hàng" : "Chưa có khách hàng nào"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || customerTypeFilter !== "all" 
              ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" 
              : "Bắt đầu bằng cách thêm khách hàng đầu tiên"
            }
          </p>
          {!searchTerm && customerTypeFilter === "all" && (
            <Button onClick={() => navigate("/organizations/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm khách hàng
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Organizations;