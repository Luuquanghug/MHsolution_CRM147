import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  TrendingUp,
  Building2,
  Package,
  DollarSign,
  History,
  Trash2,
  Edit,
  UserCheck
} from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface SalesFunnelItem {
  id: string;
  organization_id: string;
  product_id: string;
  stage: string;
  negotiated_price: number | null;
  notes: string | null;
  assigned_sales_person_id: string | null;
  expected_implementation_date: string | null;
  expected_acceptance_date: string | null;
  created_at: string;
  updated_at: string;
  organization_name: string;
  product_name: string;
  sales_person_name?: string;
  is_deleted: boolean;
  latest_update?: {
    id: string;
    updated_at: string;
    updated_by: string;
    update_reason: string | null;
    updater_name: string;
  };
  update_count: number;
}

const SalesFunnel = () => {
  const { user, loading } = useAuth();
  const { isAdmin } = useRole();
  const { setPageInfo } = usePageContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [funnelItems, setFunnelItems] = useState<SalesFunnelItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterImplementationYear, setFilterImplementationYear] = useState("");
  const [filterAcceptanceYear, setFilterAcceptanceYear] = useState("");
  const [filterSalesPerson, setFilterSalesPerson] = useState("");
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [salesPeople, setSalesPeople] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stages, setStages] = useState([
    { value: "prospect", label: "Tiềm năng", color: "secondary" },
    { value: "qualified", label: "Đủ điều kiện", color: "default" },
    { value: "proposal", label: "Đề xuất", color: "default" },
    { value: "negotiation", label: "Thương thảo", color: "default" },
    { value: "closed_won", label: "Thành công", color: "default" },
    { value: "closed_lost", label: "Thất bại", color: "destructive" },
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPageInfo("Phễu Bán hàng", "Theo dõi hành trình của các tổ chức với sản phẩm dịch vụ");
  }, [setPageInfo]);


  useEffect(() => {
    if (user) {
      fetchSalesFunnel();
    }
  }, [user]);

  const fetchSalesFunnel = async () => {
    console.log('Starting fetchSalesFunnel...');
    try {
      // Fetch stages first
      const { data: stagesData } = await supabase
        .from('sales_funnel_stages')
        .select('stage_key, stage_label, stage_color')
        .eq('is_active', true)
        .order('stage_order');

      if (stagesData) {
        setStages(stagesData.map(stage => ({
          value: stage.stage_key,
          label: stage.stage_label,
          color: stage.stage_color,
        })));
      }

      // Fetch organizations, products and sales people for filters
      const orgsResult = await supabase.from('organizations').select('id, name').order('name');
      const productsResult = await supabase.from('products').select('id, name, category').eq('is_active', true).order('name');
      const salesResult = await supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name');
      
      if (orgsResult.data) setOrganizations(orgsResult.data);
      if (productsResult.data) setProducts(productsResult.data);
      if (salesResult.data) setSalesPeople(salesResult.data);

      // Fetch sales funnel with related data, filtering out deleted items
      const { data, error } = await supabase
        .from('sales_funnel')
        .select(`
          *,
          organizations(name),
          products(name, category),
          profiles(full_name)
        `)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Sales funnel fetch error:', error);
        throw error;
      }
      
      // Fetch latest update info for each item
      const itemsWithUpdates = await Promise.all((data || []).map(async (item: any) => {
        // Get latest update
        const { data: latestUpdate } = await supabase
          .from('sales_funnel_updates')
          .select(`
            id,
            updated_at,
            updated_by,
            update_reason,
            profiles(full_name)
          `)
          .eq('sales_funnel_id', item.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        // Get update count
        const { count: updateCount } = await supabase
          .from('sales_funnel_updates')
          .select('*', { count: 'exact', head: true })
          .eq('sales_funnel_id', item.id);

        return {
          ...item,
          organization_name: item.organizations?.name || '',
          product_name: item.products?.name || '',
          sales_person_name: item.profiles?.full_name || undefined,
          latest_update: latestUpdate?.[0] ? {
            id: latestUpdate[0].id,
            updated_at: latestUpdate[0].updated_at,
            updated_by: latestUpdate[0].updated_by,
            update_reason: latestUpdate[0].update_reason,
            updater_name: latestUpdate[0].profiles?.full_name || 'Không xác định',
          } : undefined,
          update_count: updateCount || 0,
        };
      }));
      
      console.log('Final itemsWithUpdates:', itemsWithUpdates.length);
      setFunnelItems(itemsWithUpdates);
    } catch (error: any) {
      console.error('Sales funnel error:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải dữ liệu phễu bán hàng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = funnelItems.filter(item => {
    const matchesSearch = 
      item.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sales_person_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = filterStage === "all" || !filterStage || item.stage === filterStage;
    const matchesOrganization = !filterOrganization || item.organization_id === filterOrganization;
    const matchesProduct = !filterProduct || item.product_id === filterProduct;
    
    const matchesImplementationYear = !filterImplementationYear || 
      (item.expected_implementation_date && new Date(item.expected_implementation_date).getFullYear().toString() === filterImplementationYear);
    
    const matchesAcceptanceYear = !filterAcceptanceYear || 
      (item.expected_acceptance_date && new Date(item.expected_acceptance_date).getFullYear().toString() === filterAcceptanceYear);
    
    const matchesSalesPerson = !filterSalesPerson || item.assigned_sales_person_id === filterSalesPerson;
    
    return matchesSearch && matchesStage && matchesOrganization && matchesProduct && 
           matchesImplementationYear && matchesAcceptanceYear && matchesSalesPerson;
  });

  // Pagination logic
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStage, filterOrganization, filterProduct, filterImplementationYear, filterAcceptanceYear, filterSalesPerson]);

  // Get unique years from implementation and acceptance dates - memoized to prevent re-render loops
  const getAvailableYears = useCallback((dateField: 'expected_implementation_date' | 'expected_acceptance_date') => {
    console.log('getAvailableYears called for:', dateField, 'funnelItems length:', funnelItems.length);
    if (!funnelItems || funnelItems.length === 0) {
      console.log('No funnel items available');
      return [];
    }
    
    const years = new Set<string>();
    funnelItems.forEach(item => {
      const date = item[dateField];
      if (date) {
        try {
          const year = new Date(date).getFullYear().toString();
          if (!isNaN(Number(year))) {
            years.add(year);
          }
        } catch (error) {
          console.error('Error parsing date:', date, error);
        }
      }
    });
    const result = Array.from(years).sort().reverse();
    console.log('Available years for', dateField, ':', result);
    return result;
  }, [funnelItems]);

  // Memoize the years arrays
  const implementationYears = useMemo(() => getAvailableYears('expected_implementation_date'), [getAvailableYears]);
  const acceptanceYears = useMemo(() => getAvailableYears('expected_acceptance_date'), [getAvailableYears]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Chưa thương thảo";
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStageInfo = (stage: string) => {
    return stages.find(s => s.value === stage) || { value: stage, label: stage, color: "secondary" };
  };

  const handleDelete = async (item: SalesFunnelItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!isAdmin) {
      toast({
        title: "Không có quyền",
        description: "Chỉ admin mới có thể xóa cơ hội bán hàng",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn xóa cơ hội bán hàng này? Thao tác này không thể hoàn tác.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sales_funnel')
        .update({ is_deleted: true })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã xóa cơ hội bán hàng",
      });

      // Refresh the list
      fetchSalesFunnel();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa cơ hội bán hàng",
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = (item: SalesFunnelItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/sales-funnel/${item.id}/history`);
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
              <BreadcrumbPage>Phễu Bán hàng</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button onClick={() => navigate("/sales-funnel/new")} className="w-auto" size="sm">
          <Plus className="h-4 w-4" />
          <span>Thêm cơ hội mới</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4 sm:space-y-0 sm:flex sm:gap-4 sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-4">
          <SearchableSelect
            options={[
              { value: "", label: "Tất cả tổ chức" },
              ...organizations.map((org) => ({
                value: org.id,
                label: org.name,
              }))
            ]}
            value={filterOrganization}
            onValueChange={setFilterOrganization}
            placeholder="Lọc tổ chức"
            searchPlaceholder="Tìm kiếm tổ chức..."
            emptyMessage="Không tìm thấy tổ chức nào."
            className="w-full"
          />
          <SearchableSelect
            options={[
              { value: "", label: "Tất cả sản phẩm" },
              ...products.map((product) => ({
                value: product.id,
                label: product.name,
                description: product.category || undefined,
              }))
            ]}
            value={filterProduct}
            onValueChange={setFilterProduct}
            placeholder="Lọc sản phẩm"
            searchPlaceholder="Tìm kiếm sản phẩm..."
            emptyMessage="Không tìm thấy sản phẩm nào."
            className="w-full"
          />
          <Select value={filterImplementationYear} onValueChange={(value) => setFilterImplementationYear(value === "all" ? "" : value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn năm triển khai" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Không chọn năm</SelectItem>
              {implementationYears.map(year => (
                <SelectItem key={`impl-${year}`} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAcceptanceYear} onValueChange={(value) => setFilterAcceptanceYear(value === "all" ? "" : value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn năm nghiệm thu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Không chọn năm</SelectItem>
              {acceptanceYears.map(year => (
                <SelectItem key={`accept-${year}`} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SearchableSelect
            options={[
              { value: "", label: "Tất cả nhân viên" },
              ...salesPeople.map((person) => ({
                value: person.id,
                label: person.full_name,
              }))
            ]}
            value={filterSalesPerson}
            onValueChange={setFilterSalesPerson}
            placeholder="Lọc nhân viên"
            searchPlaceholder="Tìm kiếm nhân viên..."
            emptyMessage="Không tìm thấy nhân viên nào."
            className="w-full"
          />
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / trang</SelectItem>
              <SelectItem value="20">20 / trang</SelectItem>
              <SelectItem value="50">50 / trang</SelectItem>
              <SelectItem value="100">100 / trang</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Revenue Summary */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Tổng Doanh thu Dự kiến</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {formatPrice(filteredItems.filter(item => item.stage !== "closed_lost").reduce((sum, item) => sum + (item.negotiated_price || 0), 0))}
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredItems.filter(item => item.stage !== "closed_lost").length} cơ hội
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile/Desktop Layout */}
      <div className="space-y-4 lg:flex lg:gap-6 lg:min-h-screen lg:space-y-0">
        {/* Column 1: Funnel Visualization */}
        <div className="lg:w-[300px] lg:flex-shrink-0">
          <Card className="p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-center">Phễu Bán hàng</h3>
            
            {/* Desktop Funnel - Vertical */}
            <div className="hidden lg:block">
              <div className="relative flex flex-col items-center" style={{ height: 'calc(100vh - 200px)' }}>
                {stages.map((stage, index) => {
                  const topWidth = 250 - (index * (200 / stages.length));
                  const bottomWidth = 250 - ((index + 1) * (200 / stages.length));
                  const height = `calc((100vh - 200px) / ${stages.length})`;
                  const isSelected = filterStage === stage.value;
                  
                  return (
                    <div
                      key={stage.value}
                      className={`relative cursor-pointer transition-all duration-200 hover:opacity-80 ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                      style={{
                        height,
                        clipPath: `polygon(
                          ${(250 - topWidth) / 2}px 0%, 
                          ${(250 + topWidth) / 2}px 0%, 
                          ${(250 + bottomWidth) / 2}px 100%, 
                          ${(250 - bottomWidth) / 2}px 100%
                        )`,
                        backgroundColor: stage.color,
                        width: `250px`
                      }}
                      onClick={() => setFilterStage(filterStage === stage.value ? "" : stage.value)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                       <div className="text-center text-white drop-shadow-lg">
                           <div className="font-semibold text-sm">{stage.label}</div>
                           <div className="text-xs mt-1">
                             {filteredItems.filter(item => item.stage === stage.value).length} cơ hội
                           </div>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Mobile Funnel - Same as Desktop */}
            <div className="lg:hidden">
              <div className="relative flex flex-col items-center" style={{ height: '400px' }}>
                {stages.map((stage, index) => {
                  const topWidth = 200 - (index * (150 / stages.length));
                  const bottomWidth = 200 - ((index + 1) * (150 / stages.length));
                  const height = `calc(400px / ${stages.length})`;
                  const isSelected = filterStage === stage.value;
                  
                  return (
                    <div
                      key={stage.value}
                      className={`relative cursor-pointer transition-all duration-200 hover:opacity-80 ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}
                      style={{
                        height,
                        clipPath: `polygon(
                          ${(200 - topWidth) / 2}px 0%, 
                          ${(200 + topWidth) / 2}px 0%, 
                          ${(200 + bottomWidth) / 2}px 100%, 
                          ${(200 - bottomWidth) / 2}px 100%
                        )`,
                        backgroundColor: stage.color,
                        width: `200px`
                      }}
                      onClick={() => setFilterStage(filterStage === stage.value ? "" : stage.value)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                       <div className="text-center text-white drop-shadow-lg">
                           <div className="font-semibold text-xs sm:text-sm">{stage.label}</div>
                           <div className="text-xs mt-1">
                             {filteredItems.filter(item => item.stage === stage.value).length} cơ hội
                           </div>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {filterStage && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3 sm:mt-4 text-xs sm:text-sm"
                onClick={() => setFilterStage("")}
              >
                Xóa bộ lọc
              </Button>
            )}
          </Card>
        </div>

        {/* Column 2: Opportunity Cards/Table */}
        <div className="flex-1 space-y-4">
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {paginatedItems.map((item) => {
              const stageInfo = getStageInfo(item.stage);
              return (
                <Card 
                  key={item.id} 
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(`/sales-funnel/${item.id}/history`)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{item.organization_name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{stageInfo.label}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.product_name}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{formatPrice(item.negotiated_price)}</span>
                          <span>{item.sales_person_name || "Chưa phân công"}</span>
                        </div>
                        {(item.expected_implementation_date || item.expected_acceptance_date) && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {item.expected_implementation_date && (
                              <div>Triển khai: {formatDate(item.expected_implementation_date)}</div>
                            )}
                            {item.expected_acceptance_date && (
                              <div>Nghiệm thu: {formatDate(item.expected_acceptance_date)}</div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.latest_update?.updated_at || item.updated_at)}
                        </span>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleViewHistory(item, e)}
                            className="h-8 px-2.5"
                          >
                            <History className="h-3.5 w-3.5" />
                            <span className="sr-only">Xem lịch sử</span>
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => handleDelete(item, e)}
                              className="h-8 px-2.5 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Xóa</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tổ chức</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Giai đoạn</TableHead>
                      <TableHead>Giá dự kiến</TableHead>
                      <TableHead>Phụ trách</TableHead>
                      <TableHead>TG Triển khai</TableHead>
                      <TableHead>TG Nghiệm thu</TableHead>
                      <TableHead>Cập nhật</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item) => {
                      const stageInfo = getStageInfo(item.stage);
                      return (
                         <TableRow 
                          key={item.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/sales-funnel/${item.id}/history`)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {item.organization_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {item.product_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full border border-border"
                                style={{ backgroundColor: stageInfo.color }}
                              />
                              <Badge variant="secondary">{stageInfo.label}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              {formatPrice(item.negotiated_price)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.sales_person_name ? (
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                {item.sales_person_name}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Chưa phân công</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {item.expected_implementation_date ? formatDate(item.expected_implementation_date) : "Chưa xác định"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {item.expected_acceptance_date ? formatDate(item.expected_acceptance_date) : "Chưa xác định"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">{formatDate(item.latest_update?.updated_at || item.updated_at)}</div>
                              {item.latest_update && (
                                <div className="text-xs text-muted-foreground">
                                  bởi {item.latest_update.updater_name}
                                  {item.update_count > 0 && (
                                    <span className="ml-1">({item.update_count} lần cập nhật)</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleViewHistory(item, e)}
                              >
                                <History className="h-4 w-4 mr-1" />
                                Lịch sử
                              </Button>
                              {isAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => handleDelete(item, e)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Xóa
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Hiển thị {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} trong tổng số {totalItems} cơ hội
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current page
                      return page === 1 || 
                             page === totalPages || 
                             Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, index, arr) => {
                      // Add ellipsis if there's a gap
                      const showEllipsis = index > 0 && page - arr[index - 1] > 1;
                      
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && (
                            <PaginationItem>
                              <span className="px-3 py-2">...</span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </div>
                      );
                    })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || filterStage || filterOrganization || filterProduct || filterImplementationYear || filterAcceptanceYear || filterSalesPerson ? "Không tìm thấy cơ hội" : "Chưa có cơ hội bán hàng nào"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStage || filterOrganization || filterProduct || filterImplementationYear || filterAcceptanceYear || filterSalesPerson
                  ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc" 
                  : "Bắt đầu bằng cách thêm cơ hội bán hàng đầu tiên"
                }
              </p>
              {!searchTerm && !filterStage && !filterOrganization && !filterProduct && !filterImplementationYear && !filterAcceptanceYear && !filterSalesPerson && (
                <Button onClick={() => navigate("/sales-funnel/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm cơ hội
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesFunnel;