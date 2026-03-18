import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Users, Eye, Building2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
  type: string;
  logo_url: string | null;
  address: string | null;
}

export default function OrganizationGroups() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setPageInfo } = usePageContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupOrganizations, setGroupOrganizations] = useState<Organization[]>([]);
  const [showOrganizations, setShowOrganizations] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setPageInfo("Quản lý Nhóm Khách hàng", "Quản lý các nhóm khách hàng và phân loại");
  }, [setPageInfo]);

  const { data: groups, isLoading, refetch } = useQuery({
    queryKey: ["organization-groups"],
    queryFn: async () => {
      // Get groups with count of organizations in each group
      const { data, error } = await supabase
        .from("organization_groups")
        .select(`
          *,
          organization_group_memberships(count)
        `)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa nhóm khách hàng này?")) return;

    try {
      const { error } = await supabase
        .from("organization_groups")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã xóa nhóm khách hàng thành công",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewOrganizations = async (group: any) => {
    try {
      const { data, error } = await supabase
        .from("organization_group_memberships")
        .select(`
          organizations (
            id,
            name,
            type,
            logo_url,
            address
          )
        `)
        .eq("group_id", group.id);

      if (error) throw error;

      const orgs = data?.map(membership => membership.organizations).filter(Boolean) || [];
      setGroupOrganizations(orgs);
      setSelectedGroup(group);
      setShowOrganizations(true);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách khách hàng",
        variant: "destructive",
      });
    }
  };

  // Filter groups based on search term
  const filteredGroups = groups?.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGroups = filteredGroups.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Đang tải...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Nhóm Khách hàng</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button onClick={() => navigate("/organization-groups/new")} className="shrink-0 self-start px-3 sm:self-auto sm:px-4" size="sm">
          <Plus className="h-4 w-4" />
          Thêm nhóm mới
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm nhóm khách hàng..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
          className="pl-9"
        />
      </div>

      {/* Table controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredGroups.length)} trong tổng số {filteredGroups.length} nhóm
          {searchTerm && ` (đã lọc từ ${groups?.length || 0} nhóm)`}
        </div>
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

      {/* Groups Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Tên nhóm</TableHead>
              <TableHead className="min-w-[200px] hidden sm:table-cell">Mô tả</TableHead>
              <TableHead className="min-w-[120px]">Số lượng tổ chức</TableHead>
              <TableHead className="min-w-[100px] hidden md:table-cell">Trạng thái</TableHead>
              <TableHead className="min-w-[200px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGroups.map((group: any) => (
              <TableRow key={group.id}>
                <TableCell>
                  <button
                    onClick={() => handleViewOrganizations(group)}
                    className="font-medium text-primary hover:underline text-left"
                  >
                    {group.name}
                  </button>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {group.description || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{group.organization_group_memberships?.[0]?.count || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={group.is_active ? "default" : "secondary"}>
                    {group.is_active ? "Hoạt động" : "Không hoạt động"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrganizations(group)}
                      className="text-xs px-2"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      <span className="hidden sm:inline">Xem</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/organization-groups/${group.id}/edit`)}
                      className="text-xs px-2"
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      <span className="hidden sm:inline">Sửa</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(group.id)}
                      className="text-xs px-2"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      <span className="hidden sm:inline">Xóa</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
      )}

      {!groups?.length && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chưa có nhóm khách hàng nào</h3>
          <p className="text-muted-foreground mb-4">
            Bắt đầu bằng cách tạo nhóm khách hàng đầu tiên
          </p>
          <Button onClick={() => navigate("/organization-groups/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhóm đầu tiên
          </Button>
        </div>
      )}

      {/* Organizations Dialog */}
      <Dialog open={showOrganizations} onOpenChange={setShowOrganizations}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Danh sách khách hàng trong nhóm "{selectedGroup?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {groupOrganizations.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Địa chỉ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupOrganizations.map((org) => (
                      <TableRow 
                        key={org.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          navigate(`/organizations/${org.id}`);
                          setShowOrganizations(false);
                        }}
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
                            <span className="font-medium">{org.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {org.type === 'b2b' ? 'B2B' : 'B2G'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {org.address || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nhóm này chưa có khách hàng nào</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}