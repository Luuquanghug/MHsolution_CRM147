import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface Profile {
  id: string;
  full_name: string;
}

interface OrganizationGroup {
  id: string;
  name: string;
}

const OrganizationForm = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [organizationGroups, setOrganizationGroups] = useState<OrganizationGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "b2b" as "b2b" | "b2g",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo_url: "",
    tax_code: "",
    description: "",
    assigned_sales_person_id: "unassigned",
    sales_stage: "prospect" as "prospect" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost",
  });

  const isEditing = !!id;


  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchOrganizationGroups();
      if (isEditing) {
        fetchOrganization();
      }
    }
  }, [user, id, isEditing]);

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

  const fetchOrganizationGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_groups')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setOrganizationGroups(data || []);
    } catch (error) {
      console.error('Error fetching organization groups:', error);
    }
  };

  const fetchOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setFormData({
        name: data.name || "",
        type: data.type || "b2b",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        website: data.website || "",
        logo_url: data.logo_url || "",
        tax_code: data.tax_code || "",
        description: data.description || "",
        assigned_sales_person_id: data.assigned_sales_person_id || "unassigned",
        sales_stage: data.sales_stage || "prospect",
      });

      // Fetch existing group memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('organization_group_memberships')
        .select('group_id')
        .eq('organization_id', id);

      if (membershipsError) throw membershipsError;
      setSelectedGroups(memberships?.map(m => m.group_id) || []);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin khách hàng",
        variant: "destructive",
      });
      navigate("/organizations");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        assigned_sales_person_id: formData.assigned_sales_person_id === "unassigned" ? null : formData.assigned_sales_person_id,
      };

      let organizationId = id;

      if (isEditing) {
        const { error } = await supabase
          .from('organizations')
          .update(dataToSubmit)
          .eq('id', id);

        if (error) throw error;

        // Update group memberships
        await updateGroupMemberships(id!);

        toast({
          title: "Thành công",
          description: "Cập nhật khách hàng thành công",
        });
      } else {
        // Auto-assign to current user if they are sales person
        const finalData = { ...dataToSubmit };
        if (!isAdmin && user?.id) {
          finalData.assigned_sales_person_id = user.id;
        }

        const { data, error } = await supabase
          .from('organizations')
          .insert([finalData])
          .select('id')
          .single();

        if (error) throw error;
        organizationId = data.id;

        // Create group memberships
        await updateGroupMemberships(organizationId);

        toast({
          title: "Thành công",
          description: "Thêm khách hàng thành công",
        });
      }

      navigate("/organizations");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: isEditing ? "Không thể cập nhật khách hàng" : "Không thể thêm khách hàng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateGroupMemberships = async (orgId: string) => {
    // Delete existing memberships
    await supabase
      .from('organization_group_memberships')
      .delete()
      .eq('organization_id', orgId);

    // Insert new memberships
    if (selectedGroups.length > 0) {
      const memberships = selectedGroups.map(groupId => ({
        organization_id: orgId,
        group_id: groupId
      }));

      const { error } = await supabase
        .from('organization_group_memberships')
        .insert(memberships);

      if (error) throw error;
    }
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
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
        <Button variant="ghost" onClick={() => navigate("/organizations")} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Điền thông tin chi tiết về khách hàng và đối tác
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Tên khách hàng *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập tên khách hàng"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Loại khách hàng *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as "b2b" | "b2g" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="b2b">B2B (Doanh nghiệp)</SelectItem>
                      <SelectItem value="b2g">B2G (Cơ quan nhà nước)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Nhóm khách hàng</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto border rounded-md p-3">
                    {organizationGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground col-span-2">
                        Chưa có nhóm khách hàng nào. 
                        <Button 
                          type="button" 
                          variant="link" 
                          className="p-0 h-auto text-sm"
                          onClick={() => navigate("/organization-groups/new")}
                        >
                          Tạo nhóm mới
                        </Button>
                      </p>
                    ) : (
                      organizationGroups.map((group) => (
                        <div key={group.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={group.id}
                            checked={selectedGroups.includes(group.id)}
                            onCheckedChange={() => handleGroupToggle(group.id)}
                          />
                          <Label
                            htmlFor={group.id}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {group.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@company.com"
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
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://company.com"
                  />
                </div>

                <div>
                  <ImageUpload
                    label="Logo công ty"
                    value={formData.logo_url}
                    onChange={(value) => setFormData(prev => ({ ...prev, logo_url: value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <Label htmlFor="tax_code">Mã số thuế</Label>
                  <Input
                    id="tax_code"
                    value={formData.tax_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, tax_code: e.target.value }))}
                    placeholder="0123456789"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Nhập địa chỉ đầy đủ"
                />
              </div>

              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả về tổ chức..."
                  rows={3}
                />
              </div>

              {/* Sales Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isAdmin && (
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
                )}

                <div>
                  <Label htmlFor="sales_stage">Giai đoạn bán hàng</Label>
                  <Select 
                    value={formData.sales_stage} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sales_stage: value as "prospect" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Tiềm năng</SelectItem>
                      <SelectItem value="qualified">Đã đủ điều kiện</SelectItem>
                      <SelectItem value="proposal">Đề xuất</SelectItem>
                      <SelectItem value="negotiation">Đàm phán</SelectItem>
                      <SelectItem value="closed_won">Thành công</SelectItem>
                      <SelectItem value="closed_lost">Thất bại</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Đang lưu..." : (isEditing ? "Cập nhật" : "Thêm mới")}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/organizations")}>
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrganizationForm;