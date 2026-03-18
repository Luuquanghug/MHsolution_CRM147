import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePageContext } from "@/contexts/PageContext";


interface FieldGroup {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface FieldDefinition {
  id: string;
  field_group_id: string | null;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'boolean' | 'select_single' | 'select_multiple' | 'textarea' | 'email' | 'phone' | 'url';
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  field_config: any;
  min_length: number | null;
  max_length: number | null;
  min_value: number | null;
  max_value: number | null;
  regex_pattern: string | null;
}

const fieldTypes = [
  { value: 'text', label: 'Văn bản' },
  { value: 'number', label: 'Số' },
  { value: 'date', label: 'Ngày tháng' },
  { value: 'boolean', label: 'Đúng/Sai' },
  { value: 'select_single', label: 'Chọn đơn' },
  { value: 'select_multiple', label: 'Chọn nhiều' },
  { value: 'textarea', label: 'Văn bản dài' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Số điện thoại' },
  { value: 'url', label: 'Đường dẫn' },
];

export default function PersonnelFieldsConfig() {
  const { setPageInfo } = usePageContext();
  const { toast } = useToast();
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    setPageInfo("Cấu hình Nhân sự chủ chốt", "Quản lý nhóm thuộc tính và thuộc tính của nhân sự chủ chốt");
    fetchData();
  }, [setPageInfo]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch field groups for personnel entity type only
      const { data: groupsData, error: groupsError } = await supabase
        .from('field_groups')
        .select('*')
        .eq('entity_type', 'personnel')
        .order('display_order', { ascending: true });

      if (groupsError) throw groupsError;

      // Fetch field definitions for personnel entity type only
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('field_definitions')
        .select('*')
        .eq('entity_type', 'personnel')
        .order('display_order', { ascending: true });

      if (fieldsError) throw fieldsError;

      setFieldGroups(groupsData || []);
      setFieldDefinitions(fieldsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải dữ liệu cấu hình"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveGroup = async (group: Partial<FieldGroup>) => {
    try {
      if (group.id) {
        // Update existing group
        const { error } = await supabase
          .from('field_groups')
          .update({
            name: group.name,
            description: group.description,
            display_order: group.display_order,
            is_active: group.is_active
          })
          .eq('id', group.id);

        if (error) throw error;
      } else {
        // Create new group
        const { error } = await supabase
          .from('field_groups')
          .insert({
            name: group.name,
            description: group.description,
            display_order: group.display_order || 0,
            is_active: group.is_active ?? true
          });

        if (error) throw error;
      }

      toast({
        title: "Thành công",
        description: group.id ? "Đã cập nhật nhóm thuộc tính" : "Đã tạo nhóm thuộc tính mới"
      });

      fetchData();
      setEditingGroup(null);
    } catch (error) {
      console.error('Error saving group:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu nhóm thuộc tính"
      });
    }
  };

  const saveField = async (field: Partial<FieldDefinition>) => {
    try {
      if (field.id) {
        // Update existing field
        const { error } = await supabase
          .from('field_definitions')
          .update({
            field_group_id: field.field_group_id,
            field_key: field.field_key,
            field_label: field.field_label,
            field_type: field.field_type as any,
            is_required: field.is_required,
            display_order: field.display_order,
            is_active: field.is_active,
            field_config: field.field_config,
            min_length: field.min_length,
            max_length: field.max_length,
            min_value: field.min_value,
            max_value: field.max_value,
            regex_pattern: field.regex_pattern
          })
          .eq('id', field.id);

        if (error) throw error;
      } else {
        // Create new field
        const { error } = await supabase
          .from('field_definitions')
          .insert({
            field_group_id: field.field_group_id,
            field_key: field.field_key!,
            field_label: field.field_label!,
            field_type: field.field_type as any,
            is_required: field.is_required ?? false,
            display_order: field.display_order || 0,
            is_active: field.is_active ?? true,
            field_config: field.field_config || {},
            min_length: field.min_length,
            max_length: field.max_length,
            min_value: field.min_value,
            max_value: field.max_value,
            regex_pattern: field.regex_pattern
          });

        if (error) throw error;
      }

      toast({
        title: "Thành công",
        description: field.id ? "Đã cập nhật thuộc tính" : "Đã tạo thuộc tính mới"
      });

      fetchData();
      setEditingField(null);
    } catch (error) {
      console.error('Error saving field:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu thuộc tính"
      });
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('field_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã xóa nhóm thuộc tính"
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa nhóm thuộc tính"
      });
    }
  };

  const deleteField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from('field_definitions')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã xóa thuộc tính"
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting field:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa thuộc tính"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Đang tải...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Cấu hình Nhân sự chủ chốt</h1>
        <Button 
          onClick={() => setEditingGroup('new')}
          className="w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          <span className="ml-2">Thêm nhóm thuộc tính</span>
        </Button>
      </div>

      {/* New Group Form */}
      {editingGroup === 'new' && (
        <GroupForm
          group={{}}
          onSave={saveGroup}
          onCancel={() => setEditingGroup(null)}
        />
      )}

      {/* Field Groups */}
      <div className="space-y-4">
        {fieldGroups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                    {group.name}
                    {!group.is_active && (
                      <Badge variant="secondary">Không hoạt động</Badge>
                    )}
                  </CardTitle>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {group.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingGroup(group.id)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteGroup(group.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingField(`new-${group.id}`)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {editingGroup === group.id && (
              <CardContent>
                <GroupForm
                  group={group}
                  onSave={saveGroup}
                  onCancel={() => setEditingGroup(null)}
                />
              </CardContent>
            )}

            {editingField === `new-${group.id}` && (
              <CardContent>
                <FieldForm
                  field={{ field_group_id: group.id }}
                  fieldGroups={fieldGroups}
                  onSave={saveField}
                  onCancel={() => setEditingField(null)}
                />
              </CardContent>
            )}

            <CardContent>
              <div className="space-y-2">
                {fieldDefinitions
                  .filter(field => field.field_group_id === group.id)
                  .map((field) => (
                    <div key={field.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm sm:text-base break-words">{field.field_label}</div>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            ({fieldTypes.find(t => t.value === field.field_type)?.label})
                          </span>
                          {field.is_required && (
                            <Badge variant="outline" className="text-xs">Bắt buộc</Badge>
                          )}
                          {!field.is_active && (
                            <Badge variant="secondary" className="text-xs">Không hoạt động</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingField(field.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteField(field.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {editingField === field.id && (
                        <div className="absolute z-10 mt-2 p-4 bg-background border rounded-lg shadow-lg">
                          <FieldForm
                            field={field}
                            fieldGroups={fieldGroups}
                            onSave={saveField}
                            onCancel={() => setEditingField(null)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Group Form Component
function GroupForm({ 
  group, 
  onSave, 
  onCancel 
}: { 
  group: Partial<FieldGroup>;
  onSave: (group: Partial<FieldGroup>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: group.name || '',
    description: group.description || '',
    display_order: group.display_order || 0,
    is_active: group.is_active ?? true
  });

  return (
    <div className="space-y-4 p-3 sm:p-4 border rounded-lg bg-muted/50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="name" className="text-sm">Tên nhóm</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Tên nhóm thuộc tính"
          />
        </div>
        <div>
          <Label htmlFor="display_order" className="text-sm">Thứ tự hiển thị</Label>
          <Input
            id="display_order"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description" className="text-sm">Mô tả</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Mô tả nhóm thuộc tính"
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          <Label htmlFor="is_active" className="text-sm">Hoạt động</Label>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} size="sm" className="flex-1 sm:flex-none">
            <X className="h-4 w-4" />
            <span className="ml-2">Hủy</span>
          </Button>
          <Button onClick={() => onSave({ ...group, ...formData })} size="sm" className="flex-1 sm:flex-none">
            <Save className="h-4 w-4" />
            <span className="ml-2">Lưu</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Field Form Component
function FieldForm({ 
  field, 
  fieldGroups,
  onSave, 
  onCancel 
}: { 
  field: Partial<FieldDefinition>;
  fieldGroups: FieldGroup[];
  onSave: (field: Partial<FieldDefinition>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    field_group_id: field.field_group_id || '',
    field_key: field.field_key || '',
    field_label: field.field_label || '',
    field_type: field.field_type || 'text',
    is_required: field.is_required ?? false,
    display_order: field.display_order || 0,
    is_active: field.is_active ?? true,
    field_config: field.field_config || {},
    min_length: field.min_length || null,
    max_length: field.max_length || null,
    min_value: field.min_value || null,
    max_value: field.max_value || null,
    regex_pattern: field.regex_pattern || ''
  });

  return (
    <div className="space-y-4 p-3 sm:p-4 border rounded-lg bg-muted/50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="field_group_id" className="text-sm">Nhóm thuộc tính</Label>
          <Select
            value={formData.field_group_id}
            onValueChange={(value) => setFormData({ ...formData, field_group_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn nhóm" />
            </SelectTrigger>
            <SelectContent>
              {fieldGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="field_type" className="text-sm">Kiểu dữ liệu</Label>
          <Select
            value={formData.field_type}
            onValueChange={(value) => setFormData({ ...formData, field_type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fieldTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="field_key" className="text-sm">Mã trường</Label>
          <Input
            id="field_key"
            value={formData.field_key}
            onChange={(e) => setFormData({ ...formData, field_key: e.target.value })}
            placeholder="field_key"
          />
        </div>
        <div>
          <Label htmlFor="field_label" className="text-sm">Tên hiển thị</Label>
          <Input
            id="field_label"
            value={formData.field_label}
            onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
            placeholder="Tên thuộc tính"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_required"
              checked={formData.is_required}
              onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
            />
            <Label htmlFor="is_required" className="text-sm">Bắt buộc</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <Label htmlFor="is_active" className="text-sm">Hoạt động</Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} size="sm" className="flex-1 sm:flex-none">
            <X className="h-4 w-4" />
            <span className="ml-2">Hủy</span>
          </Button>
          <Button onClick={() => onSave({ ...field, ...formData })} size="sm" className="flex-1 sm:flex-none">
            <Save className="h-4 w-4" />
            <span className="ml-2">Lưu</span>
          </Button>
        </div>
      </div>
    </div>
  );
}