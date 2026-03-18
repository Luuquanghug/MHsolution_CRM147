import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { usePageContext } from "@/contexts/PageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

interface Organization {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  category?: string;
}

interface SalesPerson {
  id: string;
  full_name: string;
  user_roles: 'admin' | 'sales_person';
}

interface Stage {
  stage_key: string;
  stage_label: string;
  stage_color: string;
}

const SalesFunnelForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isAdmin, isSalesPerson } = useRole();
  const { setPageInfo } = usePageContext();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    organization_id: "",
    product_id: "",
    stage: "prospect",
    negotiated_price: "",
    notes: "",
    assigned_sales_person_id: "",
    expected_implementation_date: new Date() as Date | null,
    expected_acceptance_date: new Date() as Date | null,
    update_reason: "Cập nhật thông tin cơ hội bán hàng",
  });
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, id]);

  useEffect(() => {
    // Set page title and description
    const title = id ? "Chỉnh sửa cơ hội" : "Thêm cơ hội mới";
    const description = id ? "Cập nhật thông tin cơ hội bán hàng" : "Tạo cơ hội bán hàng mới";
    setPageInfo(title, description);
  }, [id, setPageInfo]);

  const fetchData = async () => {
    try {
      console.log('Fetching data for sales funnel form...');
      
      // Fetch stages
      const { data: stagesData, error: stagesError } = await supabase
        .from('sales_funnel_stages')
        .select('stage_key, stage_label, stage_color')
        .eq('is_active', true)
        .order('stage_order');

      if (stagesError) {
        console.error('Stages error:', stagesError);
        throw stagesError;
      }
      setStages(stagesData || []);

      // Fetch organizations (based on user role)
      console.log('User role check:', { isAdmin, isSalesPerson, userId: user?.id });
      let orgQuery = supabase.from('organizations').select('id, name');
      if (isSalesPerson && !isAdmin) {
        console.log('Filtering organizations for sales person');
        orgQuery = orgQuery.eq('assigned_sales_person_id', user?.id);
      }
      
      const { data: orgsData, error: orgsError } = await orgQuery;
      if (orgsError) {
        console.error('Organizations error:', orgsError);
        throw orgsError;
      }
      console.log('Organizations loaded:', orgsData?.length);
      setOrganizations(orgsData || []);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, category')
        .eq('is_active', true);

      if (productsError) {
        console.error('Products error:', productsError);
        throw productsError;
      }
      console.log('Products loaded:', productsData?.length);
      setProducts(productsData || []);

      // Fetch sales people - all users from sales team management (for everyone, not just admin)
      const { data: salesData, error: salesError } = await supabase
        .from('profiles')
        .select('id, full_name, user_roles')
        .eq('is_active', true);

      if (salesError) {
        console.error('Sales people error:', salesError);
        throw salesError;
      }
      console.log('Sales people loaded:', salesData?.length);
      setSalesPeople(salesData || []);

      // If editing, fetch existing data
      if (id) {
        console.log('Fetching existing funnel data for ID:', id);
        const { data: funnelData, error: funnelError } = await supabase
          .from('sales_funnel')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (funnelError) {
          console.error('Error fetching funnel data:', funnelError);
          throw funnelError;
        }
        
        if (!funnelData) {
          console.error('No funnel data found for ID:', id);
          toast({
            title: "Lỗi",
            description: "Không tìm thấy cơ hội bán hàng",
            variant: "destructive",
          });
          navigate("/sales-funnel");
          return;
        }
        
        console.log('Found existing funnel data:', funnelData);
        
        setFormData({
          organization_id: funnelData.organization_id,
          product_id: funnelData.product_id,
          stage: funnelData.stage,
          negotiated_price: funnelData.negotiated_price?.toString() || "",
          notes: funnelData.notes || "",
          assigned_sales_person_id: funnelData.assigned_sales_person_id || "none",
          expected_implementation_date: funnelData.expected_implementation_date ? new Date(funnelData.expected_implementation_date) : null,
          expected_acceptance_date: funnelData.expected_acceptance_date ? new Date(funnelData.expected_acceptance_date) : null,
          update_reason: "Cập nhật thông tin cơ hội bán hàng",
        });
      } else if (isSalesPerson && !id) {
        // Set current user as assigned sales person for new records  
        setFormData(prev => ({
          ...prev,
          assigned_sales_person_id: user?.id || "none",
        }));
      }
    } catch (error: any) {
      console.error('Data fetch error:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        organization_id: formData.organization_id,
        product_id: formData.product_id,
        stage: formData.stage,
        negotiated_price: formData.negotiated_price ? parseFloat(formData.negotiated_price) : null,
        notes: formData.notes || null,
        assigned_sales_person_id: formData.assigned_sales_person_id === "none" ? null : formData.assigned_sales_person_id || null,
        expected_implementation_date: formData.expected_implementation_date?.toISOString().split('T')[0] || null,
        expected_acceptance_date: formData.expected_acceptance_date?.toISOString().split('T')[0] || null,
      };

      if (id) {
        console.log('Updating existing funnel with ID:', id);
        console.log('Update data:', submitData);
        
        // Set update reason before updating
        await supabase.rpc('set_update_reason', { reason: formData.update_reason });
        
        const { error } = await supabase
          .from('sales_funnel')
          .update(submitData)
          .eq('id', id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        
        console.log('Successfully updated funnel');
        
        toast({
          title: "Thành công",
          description: "Đã cập nhật phễu bán hàng",
        });
      } else {
        const { error } = await supabase
          .from('sales_funnel')
          .insert(submitData);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        
        toast({
          title: "Thành công", 
          description: "Đã tạo phễu bán hàng mới",
        });
      }

      navigate("/sales-funnel");
    } catch (error: any) {
      console.error('Form submission error:', error);
      
      let errorMessage = "Có lỗi xảy ra";
      if (error.message?.includes('duplicate key')) {
        errorMessage = "Cơ hội bán hàng cho tổ chức và sản phẩm này đã tồn tại";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/sales-funnel">Phễu Bán hàng</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{id ? "Chỉnh sửa" : "Thêm mới"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin phễu bán hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Compact Basic Information Section */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Thông tin cơ bản</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="organization" className="text-xs">Tổ chức *</Label>
                  <SearchableSelect
                    options={organizations.map((org) => ({
                      value: org.id,
                      label: org.name,
                    }))}
                    value={formData.organization_id}
                    onValueChange={(value) => handleInputChange("organization_id", value)}
                    placeholder="Chọn tổ chức"
                    searchPlaceholder="Tìm kiếm tổ chức..."
                    emptyMessage="Không tìm thấy tổ chức nào."
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="product" className="text-xs">Sản phẩm/Dịch vụ *</Label>
                  <SearchableSelect
                    options={products.map((product) => ({
                      value: product.id,
                      label: product.name,
                      description: product.category || undefined,
                    }))}
                    value={formData.product_id}
                    onValueChange={(value) => handleInputChange("product_id", value)}
                    placeholder="Chọn sản phẩm/dịch vụ"
                    searchPlaceholder="Tìm kiếm sản phẩm..."
                    emptyMessage="Không tìm thấy sản phẩm nào."
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="stage" className="text-xs">Giai đoạn *</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) => handleInputChange("stage", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giai đoạn" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.stage_key} value={stage.stage_key}>
                          {stage.stage_label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="space-y-1">
                  <Label htmlFor="price" className="text-xs">Giá dự kiến (VND)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.negotiated_price}
                    onChange={(e) => handleInputChange("negotiated_price", e.target.value)}
                    placeholder="Nhập giá"
                    className="h-9"
                  />
                </div>

                {(formData.stage === "negotiation" || salesPeople.length > 0) && (
                  <div className="space-y-1">
                    <Label htmlFor="sales_person" className="text-xs">Nhân viên phụ trách</Label>
                    <SearchableSelect
                      options={[
                        { value: "none", label: "Không có" },
                        ...salesPeople.map((person) => ({
                          value: person.id,
                          label: person.full_name,
                          description: person.user_roles === 'admin' ? 'Admin' : 'Nhân viên',
                        }))
                      ]}
                      value={formData.assigned_sales_person_id}
                      onValueChange={(value) => handleInputChange("assigned_sales_person_id", value)}
                      placeholder="Chọn nhân viên"
                      searchPlaceholder="Tìm kiếm nhân viên..."
                      emptyMessage="Không tìm thấy nhân viên nào."
                      disabled={isSalesPerson && !isAdmin}
                    />
                    {isSalesPerson && !isAdmin && (
                      <p className="text-xs text-muted-foreground">
                        Tự động phân công
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="implementation_date" className="text-xs">Triển khai dự kiến</Label>
                  <Input
                    id="implementation_date"
                    type="date"
                    value={formData.expected_implementation_date ? new Date(formData.expected_implementation_date).toISOString().split('T')[0] : ""}
                    onChange={(e) => handleInputChange("expected_implementation_date", e.target.value ? new Date(e.target.value) : null)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="acceptance_date" className="text-xs">Nghiệm thu dự kiến</Label>
                  <Input
                    id="acceptance_date"
                    type="date"
                    value={formData.expected_acceptance_date ? new Date(formData.expected_acceptance_date).toISOString().split('T')[0] : ""}
                    onChange={(e) => handleInputChange("expected_acceptance_date", e.target.value ? new Date(e.target.value) : null)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Prominent Details Section */}
            <div className="border-2 border-primary/20 rounded-lg p-6 bg-primary/5">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded-full"></div>
                  <Label htmlFor="notes" className="text-base font-semibold text-primary">
                    Thông tin chi tiết của cơ hội
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mô tả chi tiết về cơ hội, yêu cầu của khách hàng, tình hình thị trường, và các thông tin quan trọng khác
                </p>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Nhập thông tin chi tiết về cơ hội bán hàng này..."
                  rows={8}
                  className="min-h-[200px] border-primary/30 focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            {id && (
              <div className="space-y-2">
                <Label htmlFor="update_reason" className="text-sm font-medium">Lý do cập nhật</Label>
                <Textarea
                  id="update_reason"
                  value={formData.update_reason}
                  onChange={(e) => handleInputChange("update_reason", e.target.value)}
                  placeholder="Nhập lý do cập nhật cơ hội bán hàng này..."
                  rows={3}
                  className="border-orange-200 focus:border-orange-400"
                />
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Đang lưu..." : "Lưu"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/sales-funnel")}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesFunnelForm;