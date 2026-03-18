import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  Building2,
  User
} from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface KeyPersonnel {
  id: string;
  full_name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  notes: string | null;
  organization_id: string | null;
  assigned_sales_person_id: string | null;
  organizations?: {
    name: string;
    type: string;
    logo_url: string | null;
  };
  profiles?: {
    full_name: string;
  };
  contacts?: ContactHistory[];
}

interface ContactHistory {
  id: string;
  contact_date: string;
  summary: string;
  contact_method: string;
  outcome: string | null;
  next_action: string | null;
  details: string | null;
  profiles: {
    full_name: string;
  } | null;
}

const KeyPersonnel = () => {
  const { user, loading } = useAuth();
  const { setPageInfo } = usePageContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [personnel, setPersonnel] = useState<KeyPersonnel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [organizations, setOrganizations] = useState<Array<{id: string, name: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setPageInfo("Quản lý Nhân sự chủ chốt", "Quản lý các nhân sự quan trọng của khách hàng");
  }, [setPageInfo]);


  useEffect(() => {
    if (user) {
      fetchPersonnel();
      fetchOrganizations();
    }
  }, [user]);

  const fetchPersonnel = async () => {
    try {
      const { data: personnelData, error: personnelError } = await supabase
        .from('key_personnel')
        .select(`
          *,
          organizations (
            name,
            type,
            logo_url
          ),
          profiles:assigned_sales_person_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (personnelError) throw personnelError;
      setPersonnel(personnelData || []);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách nhân sự",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  let filteredPersonnel = personnel.filter(person => {
    const matchesSearch = person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.organizations?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOrganization = filterOrganization === "all" || !filterOrganization || person.organization_id === filterOrganization;
    
    return matchesSearch && matchesOrganization;
  });

  const totalPages = Math.ceil(filteredPersonnel.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPersonnel = filteredPersonnel.slice(startIndex, startIndex + itemsPerPage);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Nhân sự chủ chốt</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button onClick={() => navigate("/key-personnel/new")} className="w-auto" size="sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Thêm nhân sự mới</span>
          <span className="sm:hidden">Thêm</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4 sm:space-y-0 sm:flex sm:gap-4 sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm nhân sự..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          <SearchableSelect
            options={[
              { value: "all", label: "Tất cả khách hàng" },
              ...organizations.map((org) => ({
                value: org.id,
                label: org.name,
              }))
            ]}
            value={filterOrganization}
            onValueChange={setFilterOrganization}
            placeholder="Lọc theo khách hàng"
            searchPlaceholder="Tìm kiếm khách hàng..."
            emptyMessage="Không tìm thấy khách hàng nào."
            className="w-full sm:w-64"
          />
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

      {/* Personnel Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Nhân sự</TableHead>
              <TableHead className="min-w-[150px] hidden sm:table-cell">Khách hàng</TableHead>
              <TableHead className="min-w-[120px] hidden md:table-cell">Liên hệ</TableHead>
              <TableHead className="min-w-[100px] hidden lg:table-cell">Phụ trách</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPersonnel.map((person) => (
              <TableRow 
                key={person.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/key-personnel/${person.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={person.avatar_url || ""} />
                      <AvatarFallback className="text-xs">
                        {getInitials(person.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{person.full_name}</div>
                      {person.position && (
                        <div className="text-sm text-muted-foreground">{person.position}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {person.organizations ? (
                    <div className="flex items-center gap-2">
                      {person.organizations.logo_url ? (
                        <img 
                          src={person.organizations.logo_url} 
                          alt={`${person.organizations.name} logo`}
                          className="h-4 w-4 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <Building2 className={`h-4 w-4 text-primary ${person.organizations.logo_url ? 'hidden' : ''}`} />
                      <span className="font-medium text-sm truncate max-w-[100px]">{person.organizations.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {person.organizations.type === 'b2b' ? 'B2B' : 'B2G'}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="space-y-1">
                    {person.email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-32">{person.email}</span>
                      </div>
                    )}
                    {person.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{person.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  {person.profiles?.full_name || "-"}
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
            Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredPersonnel.length)} trong tổng số {filteredPersonnel.length} nhân sự
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

      {filteredPersonnel.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || filterOrganization !== "all" ? "Không tìm thấy nhân sự" : "Chưa có nhân sự nào"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterOrganization !== "all" 
              ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc" 
              : "Bắt đầu bằng cách thêm nhân sự quan trọng đầu tiên"
            }
          </p>
          {!searchTerm && filterOrganization === "all" && (
            <Button onClick={() => navigate("/key-personnel/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm nhân sự
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default KeyPersonnel;