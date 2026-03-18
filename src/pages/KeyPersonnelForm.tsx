import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { PersonnelFieldsForm } from "@/components/PersonnelFieldsForm";

interface Organization {
  id: string;
  name: string;
  type: string;
}

interface Profile {
  id: string;
  full_name: string;
}

const KeyPersonnelForm = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [extendedFieldValues, setExtendedFieldValues] = useState<Record<string, any>>({});
  
  const preSelectedOrganization = searchParams.get('organization');
  
  const [formData, setFormData] = useState({
    full_name: "",
    position: "",
    email: "",
    phone: "",
    birth_date: "",
    avatar_url: "",
    organization_id: preSelectedOrganization || "unassigned",
    assigned_sales_person_id: "unassigned",
    notes: "",
  });

  const isEditing = !!id;


  useEffect(() => {
    if (user) {
      fetchOrganizations();
      fetchProfiles();
      if (isEditing) {
        fetchPersonnel();
      }
    }
  }, [user, id, isEditing]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, type')
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchPersonnel = async () => {
    try {
      const { data, error } = await supabase
        .from('key_personnel')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setFormData({
        full_name: data.full_name || "",
        position: data.position || "",
        email: data.email || "",
        phone: data.phone || "",
        birth_date: data.birth_date || "",
        avatar_url: data.avatar_url || "",
        organization_id: data.organization_id || "unassigned",
        assigned_sales_person_id: data.assigned_sales_person_id || "unassigned",
        notes: data.notes || "",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin nhân sự",
        variant: "destructive",
      });
      navigate("/key-personnel");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        organization_id: formData.organization_id === "unassigned" ? null : formData.organization_id,
        assigned_sales_person_id: formData.assigned_sales_person_id === "unassigned" ? null : formData.assigned_sales_person_id,
        birth_date: formData.birth_date || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('key_personnel')
          .update(dataToSubmit)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Cập nhật nhân sự thành công",
        });
      } else {
        const { error } = await supabase
          .from('key_personnel')
          .insert([dataToSubmit]);

        if (error) throw error;

        toast({
          title: "Thành công",
          description: "Thêm nhân sự thành công",
        });
      }

      navigate("/key-personnel");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: isEditing ? "Không thể cập nhật nhân sự" : "Không thể thêm nhân sự",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/key-personnel")} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? "Chỉnh sửa nhân sự" : "Thêm nhân sự mới"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Điền thông tin chi tiết về nhân sự quan trọng
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin nhân sự</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="full_name">Họ và tên *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="position">Chức vụ</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Giám đốc, Phó giám đốc..."
                  />
                </div>

                <div>
                  <Label htmlFor="organization_id">Khách hàng</Label>
                  <SearchableSelect
                    options={[
                      { value: "unassigned", label: "Chưa chọn khách hàng" },
                      ...organizations.map((org) => ({
                        value: org.id,
                        label: org.name,
                        description: org.type === 'b2b' ? 'B2B' : 'B2G',
                      }))
                    ]}
                    value={formData.organization_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, organization_id: value }))}
                    placeholder="Chọn khách hàng"
                    searchPlaceholder="Tìm kiếm khách hàng..."
                    emptyMessage="Không tìm thấy khách hàng nào."
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0123456789"
                  />
                </div>

                <div>
                  <Label htmlFor="birth_date">Ngày sinh</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                  />
                </div>

                <div>
                  <ImageUpload
                    label="Ảnh đại diện"
                    value={formData.avatar_url}
                    onChange={(value) => setFormData(prev => ({ ...prev, avatar_url: value }))}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Thông tin bổ sung</h3>
                
                <div>
                  <Label htmlFor="assigned_sales_person_id">Nhân viên phụ trách</Label>
                  <SearchableSelect
                    options={[
                      { value: "unassigned", label: "Chưa phân công" },
                      ...profiles.map((profile) => ({
                        value: profile.id,
                        label: profile.full_name,
                      }))
                    ]}
                    value={formData.assigned_sales_person_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_sales_person_id: value }))}
                    placeholder="Chọn nhân viên phụ trách"
                    searchPlaceholder="Tìm kiếm nhân viên..."
                    emptyMessage="Không tìm thấy nhân viên nào."
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Thông tin bổ sung về nhân sự..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Đang lưu..." : (isEditing ? "Cập nhật" : "Thêm mới")}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/key-personnel")}>
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Extended Information Form */}
        <PersonnelFieldsForm 
          personnelId={isEditing ? id : undefined}
          onValuesChange={setExtendedFieldValues}
        />
      </div>
    </div>
  );
};

export default KeyPersonnelForm;