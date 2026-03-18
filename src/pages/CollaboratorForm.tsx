import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const CollaboratorForm = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { setPageInfo } = usePageContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    commission_rate: "",
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  useEffect(() => {
    setPageInfo(
      isEditing ? "Sửa thông tin cộng tác viên" : "Thêm cộng tác viên",
      isEditing ? "Cập nhật thông tin cộng tác viên" : "Tạo cộng tác viên mới"
    );
  }, [setPageInfo, isEditing]);

  useEffect(() => {
    if (isEditing && id) {
      fetchCollaborator();
    }
  }, [id, isEditing]);

  const fetchCollaborator = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          commission_rate: data.commission_rate ? String(data.commission_rate) : "",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin cộng tác viên",
        variant: "destructive",
      });
      navigate("/collaborators");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({
        title: "Không có quyền",
        description: "Chỉ Admin mới có thể quản lý cộng tác viên",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const collaboratorData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) : null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('collaborators')
          .update(collaboratorData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Cập nhật thông tin cộng tác viên thành công",
        });
      } else {
        const { error } = await supabase
          .from('collaborators')
          .insert([collaboratorData]);

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Thêm cộng tác viên mới thành công",
        });
      }

      navigate("/collaborators");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || `Không thể ${isEditing ? "cập nhật" : "tạo"} cộng tác viên`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Không có quyền truy cập</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Chỉ Admin mới có thể quản lý cộng tác viên
          </p>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Đang tải...</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Đang tải thông tin cộng tác viên...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/collaborators">Cộng tác viên</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{isEditing ? "Sửa" : "Thêm"} cộng tác viên</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <Button
          variant="outline"
          onClick={() => navigate("/collaborators")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Sửa thông tin cộng tác viên" : "Thêm cộng tác viên mới"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Họ và tên *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="commission_rate">Tỷ lệ hoa hồng (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({...formData, commission_rate: e.target.value})}
                  placeholder="Ví dụ: 5.5"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Nhập địa chỉ đầy đủ..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Đang xử lý..." : (isEditing ? "Cập nhật" : "Tạo cộng tác viên")}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/collaborators")}
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

export default CollaboratorForm;