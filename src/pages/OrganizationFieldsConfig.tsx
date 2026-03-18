import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
// import { usePageContext } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Data types
interface FieldGroup {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  entity_type: string;
  created_at: string;
  updated_at: string;
}

interface FieldDefinition {
  id: string;
  field_group_id?: string;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'boolean' | 'select_single' | 'select_multiple' | 'textarea' | 'email' | 'phone' | 'url';
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  regex_pattern?: string;
  field_config?: any;
  entity_type: string;
  created_at: string;
  updated_at: string;
}

const fieldTypes = [
  { value: 'text', label: 'Văn bản' },
  { value: 'textarea', label: 'Văn bản dài' },
  { value: 'number', label: 'Số' },
  { value: 'date', label: 'Ngày tháng' },
  { value: 'boolean', label: 'Có/Không' },
  { value: 'select_single', label: 'Chọn một' },
  { value: 'select_multiple', label: 'Chọn nhiều' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Số điện thoại' },
  { value: 'url', label: 'Đường dẫn' },
];

// Sortable Item Component
function SortableGroupItem({ group, children }: { group: FieldGroup; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-2 top-4 cursor-grab active:cursor-grabbing z-10" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="pl-8">
        {children}
      </div>
    </div>
  );
}

function SortableFieldItem({ field, children }: { field: FieldDefinition; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-2 top-2 cursor-grab active:cursor-grabbing z-10" {...attributes} {...listeners}>
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="pl-6">
        {children}
      </div>
    </div>
  );
}

export default function OrganizationFieldsConfig() {
  // const { setPageTitle, setPageDescription } = usePageContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreatingField, setIsCreatingField] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // setPageTitle("Cấu hình trường dữ liệu tổ chức");
    // setPageDescription("Quản lý các nhóm thuộc tính và thuộc tính của tổ chức");
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [groupsResponse, fieldsResponse] = await Promise.all([
        supabase
          .from('field_groups')
          .select('*')
          .eq('entity_type', 'organization')
          .order('display_order'),
        supabase
          .from('field_definitions')
          .select('*')
          .eq('entity_type', 'organization')
          .order('display_order')
      ]);

      if (groupsResponse.error) throw groupsResponse.error;
      if (fieldsResponse.error) throw fieldsResponse.error;

      setFieldGroups((groupsResponse.data || []) as FieldGroup[]);
      setFieldDefinitions((fieldsResponse.data || []) as FieldDefinition[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveGroup = async (group: Partial<FieldGroup>) => {
    try {
      if (group.id) {
        const { error } = await supabase
          .from('field_groups')
          .update({
            name: group.name,
            description: group.description,
            is_active: group.is_active,
            display_order: group.display_order
          })
          .eq('id', group.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('field_groups')
          .insert({
            name: group.name!,
            description: group.description,
            is_active: group.is_active ?? true,
            entity_type: 'organization',
            display_order: fieldGroups.length + 1
          });
        if (error) throw error;
      }

      toast({
        title: "Thành công",
        description: group.id ? "Cập nhật nhóm thành công" : "Tạo nhóm thành công",
      });

      setEditingGroup(null);
      setIsCreatingGroup(false);
      fetchData();
    } catch (error) {
      console.error('Error saving group:', error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu nhóm",
        variant: "destructive",
      });
    }
  };

  const saveField = async (field: Partial<FieldDefinition>) => {
    try {
      if (field.id) {
        const { error } = await supabase
          .from('field_definitions')
          .update({
            field_group_id: field.field_group_id,
            field_key: field.field_key,
            field_label: field.field_label,
            field_type: field.field_type,
            is_required: field.is_required,
            is_active: field.is_active,
            display_order: field.display_order,
            min_length: field.min_length,
            max_length: field.max_length,
            min_value: field.min_value,
            max_value: field.max_value,
            regex_pattern: field.regex_pattern,
            field_config: field.field_config
          })
          .eq('id', field.id);
        if (error) throw error;
      } else {
        const fieldsInGroup = fieldDefinitions.filter(f => f.field_group_id === field.field_group_id);
        const { error } = await supabase
          .from('field_definitions')
          .insert({
            field_group_id: field.field_group_id,
            field_key: field.field_key!,
            field_label: field.field_label!,
            field_type: field.field_type!,
            is_required: field.is_required ?? false,
            is_active: field.is_active ?? true,
            entity_type: 'organization',
            display_order: fieldsInGroup.length + 1,
            min_length: field.min_length,
            max_length: field.max_length,
            min_value: field.min_value,
            max_value: field.max_value,
            regex_pattern: field.regex_pattern,
            field_config: field.field_config
          });
        if (error) throw error;
      }

      toast({
        title: "Thành công",
        description: field.id ? "Cập nhật trường thành công" : "Tạo trường thành công",
      });

      setEditingField(null);
      setIsCreatingField(null);
      fetchData();
    } catch (error) {
      console.error('Error saving field:', error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu trường",
        variant: "destructive",
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
        description: "Xóa nhóm thành công",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa nhóm",
        variant: "destructive",
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
        description: "Xóa trường thành công",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting field:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa trường",
        variant: "destructive",
      });
    }
  };

  const handleGroupDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fieldGroups.findIndex(g => g.id === active.id);
      const newIndex = fieldGroups.findIndex(g => g.id === over.id);
      
      const newOrder = arrayMove(fieldGroups, oldIndex, newIndex);
      setFieldGroups(newOrder);

      // Update display_order in database
      try {
        const updates = newOrder.map((group, index) => ({
          id: group.id,
          display_order: index + 1
        }));

        for (const update of updates) {
          await supabase
            .from('field_groups')
            .update({ display_order: update.display_order })
            .eq('id', update.id);
        }
      } catch (error) {
        console.error('Error updating group order:', error);
        fetchData(); // Reload to fix order
      }
    }
  };

  const handleFieldDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const activeField = fieldDefinitions.find(f => f.id === active.id);
      const overField = fieldDefinitions.find(f => f.id === over.id);
      
      if (activeField && overField && activeField.field_group_id === overField.field_group_id) {
        const groupFields = fieldDefinitions.filter(f => f.field_group_id === activeField.field_group_id);
        const oldIndex = groupFields.findIndex(f => f.id === active.id);
        const newIndex = groupFields.findIndex(f => f.id === over.id);
        
        const newOrder = arrayMove(groupFields, oldIndex, newIndex);
        
        // Update local state
        const newFieldDefinitions = fieldDefinitions.map(field => {
          const reorderedField = newOrder.find(f => f.id === field.id);
          return reorderedField || field;
        });
        setFieldDefinitions(newFieldDefinitions);

        // Update display_order in database
        try {
          const updates = newOrder.map((field, index) => ({
            id: field.id,
            display_order: index + 1
          }));

          for (const update of updates) {
            await supabase
              .from('field_definitions')
              .update({ display_order: update.display_order })
              .eq('id', update.id);
          }
        } catch (error) {
          console.error('Error updating field order:', error);
          fetchData(); // Reload to fix order
        }
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Đang tải...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Cấu hình trường dữ liệu tổ chức</h1>
          <p className="text-muted-foreground">Quản lý các nhóm thuộc tính và thuộc tính của tổ chức</p>
        </div>
        <Button onClick={() => setIsCreatingGroup(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm nhóm mới
        </Button>
      </div>

      {isCreatingGroup && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tạo nhóm mới</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupForm
              group={{}}
              onSave={saveGroup}
              onCancel={() => setIsCreatingGroup(false)}
            />
          </CardContent>
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
        <SortableContext items={fieldGroups.map(g => g.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {fieldGroups.map((group) => (
              <SortableGroupItem key={group.id} group={group}>
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {group.name}
                          <Badge variant={group.is_active ? "default" : "secondary"}>
                            {group.is_active ? "Hoạt động" : "Tạm dừng"}
                          </Badge>
                        </CardTitle>
                        {group.description && (
                          <CardDescription>{group.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCreatingField(group.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Thêm trường
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingGroup(group.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteGroup(group.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

                  {isCreatingField === group.id && (
                    <CardContent>
                      <h4 className="font-medium mb-4">Thêm trường mới</h4>
                      <FieldForm
                        field={{ field_group_id: group.id }}
                        fieldGroups={fieldGroups}
                        onSave={saveField}
                        onCancel={() => setIsCreatingField(null)}
                      />
                    </CardContent>
                  )}

                  <CardContent>
                    <div className="space-y-3">
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFieldDragEnd}>
                        <SortableContext 
                          items={fieldDefinitions.filter(f => f.field_group_id === group.id).map(f => f.id)} 
                          strategy={verticalListSortingStrategy}
                        >
                          {fieldDefinitions
                            .filter(field => field.field_group_id === group.id)
                            .map((field) => (
                              <SortableFieldItem key={field.id} field={field}>
                                <div className="border rounded-lg p-3">
                                  {editingField === field.id ? (
                                    <FieldForm
                                      field={field}
                                      fieldGroups={fieldGroups}
                                      onSave={saveField}
                                      onCancel={() => setEditingField(null)}
                                    />
                                  ) : (
                                    <div className="flex justify-between items-start">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{field.field_label}</span>
                                          <Badge variant="outline" className="text-xs">
                                            {fieldTypes.find(t => t.value === field.field_type)?.label}
                                          </Badge>
                                          {field.is_required && (
                                            <Badge variant="destructive" className="text-xs">Bắt buộc</Badge>
                                          )}
                                          <Badge variant={field.is_active ? "default" : "secondary"} className="text-xs">
                                            {field.is_active ? "Hoạt động" : "Tạm dừng"}
                                          </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          Key: {field.field_key}
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setEditingField(field.id)}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => deleteField(field.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </SortableFieldItem>
                            ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  </CardContent>
                </Card>
              </SortableGroupItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
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
    is_active: group.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onSave({
      ...group,
      ...formData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Tên nhóm *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nhập tên nhóm"
            required
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Hoạt động</Label>
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Nhập mô tả nhóm"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Lưu
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Hủy
        </Button>
      </div>
    </form>
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
    field_type: field.field_type || 'text' as FieldDefinition['field_type'],
    is_required: field.is_required ?? false,
    is_active: field.is_active ?? true,
    min_length: field.min_length || '',
    max_length: field.max_length || '',
    min_value: field.min_value || '',
    max_value: field.max_value || '',
    regex_pattern: field.regex_pattern || '',
    field_config: field.field_config || {},
  });

  const [selectOptions, setSelectOptions] = useState<string>(
    field.field_config?.options ? field.field_config.options.join('\n') : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.field_key.trim() || !formData.field_label.trim()) return;
    
    let field_config = formData.field_config;
    if ((formData.field_type === 'select_single' || formData.field_type === 'select_multiple') && selectOptions.trim()) {
      field_config = {
        ...field_config,
        options: selectOptions.split('\n').filter(option => option.trim())
      };
    }

    onSave({
      ...field,
      ...formData,
      min_length: formData.min_length ? parseInt(formData.min_length.toString()) : null,
      max_length: formData.max_length ? parseInt(formData.max_length.toString()) : null,
      min_value: formData.min_value ? parseFloat(formData.min_value.toString()) : null,
      max_value: formData.max_value ? parseFloat(formData.max_value.toString()) : null,
      field_config,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="field_group_id">Nhóm</Label>
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
          <Label htmlFor="field_type">Loại dữ liệu *</Label>
          <Select
            value={formData.field_type}
            onValueChange={(value) => setFormData({ ...formData, field_type: value as FieldDefinition['field_type'] })}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="field_key">Key (không dấu, không khoảng trắng) *</Label>
          <Input
            id="field_key"
            value={formData.field_key}
            onChange={(e) => setFormData({ ...formData, field_key: e.target.value })}
            placeholder="field_key"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="field_label">Nhãn hiển thị *</Label>
          <Input
            id="field_label"
            value={formData.field_label}
            onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
            placeholder="Nhãn hiển thị"
            required
          />
        </div>
      </div>

      {(formData.field_type === 'select_single' || formData.field_type === 'select_multiple') && (
        <div>
          <Label htmlFor="options">Tùy chọn (mỗi dòng một tùy chọn)</Label>
          <Textarea
            id="options"
            value={selectOptions}
            onChange={(e) => setSelectOptions(e.target.value)}
            placeholder="Tùy chọn 1&#10;Tùy chọn 2&#10;Tùy chọn 3"
          />
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {(formData.field_type === 'text' || formData.field_type === 'textarea') && (
          <>
            <div>
              <Label htmlFor="min_length">Độ dài tối thiểu</Label>
              <Input
                id="min_length"
                type="number"
                value={formData.min_length}
                onChange={(e) => setFormData({ ...formData, min_length: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="max_length">Độ dài tối đa</Label>
              <Input
                id="max_length"
                type="number"
                value={formData.max_length}
                onChange={(e) => setFormData({ ...formData, max_length: e.target.value })}
              />
            </div>
          </>
        )}

        {formData.field_type === 'number' && (
          <>
            <div>
              <Label htmlFor="min_value">Giá trị tối thiểu</Label>
              <Input
                id="min_value"
                type="number"
                value={formData.min_value}
                onChange={(e) => setFormData({ ...formData, min_value: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="max_value">Giá trị tối đa</Label>
              <Input
                id="max_value"
                type="number"
                value={formData.max_value}
                onChange={(e) => setFormData({ ...formData, max_value: e.target.value })}
              />
            </div>
          </>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="is_required"
            checked={formData.is_required}
            onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
          />
          <Label htmlFor="is_required">Bắt buộc</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Hoạt động</Label>
        </div>
      </div>

      {formData.field_type === 'text' && (
        <div>
          <Label htmlFor="regex_pattern">Biểu thức chính quy (tùy chọn)</Label>
          <Input
            id="regex_pattern"
            value={formData.regex_pattern}
            onChange={(e) => setFormData({ ...formData, regex_pattern: e.target.value })}
            placeholder="^[a-zA-Z0-9]+$"
          />
        </div>
      )}

      <Separator />

      <div className="flex gap-2">
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Lưu
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Hủy
        </Button>
      </div>
    </form>
  );
}