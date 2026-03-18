import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { usePageContext } from "@/contexts/PageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus,
  Edit2,
  Save,
  X,
  Settings,
  TrendingUp,
  GripVertical
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Stage {
  id: string;
  stage_key: string;
  stage_label: string;
  stage_order: number;
  stage_color: string;
  stage_description?: string;
  is_active: boolean;
}

const SortableStageItem = ({ stage, isEditing, onEdit, formData, setFormData, onSave, onCancel, colorOptions }: {
  stage: Stage;
  isEditing: boolean;
  onEdit: (stage: Stage) => void;
  formData: any;
  setFormData: any;
  onSave: (stageId: string) => void;
  onCancel: () => void;
  colorOptions: string[];
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={isDragging ? "shadow-lg" : ""}>
      <CardContent className="p-6">
        {isEditing ? (
           <div className="space-y-4">
             <div className="grid grid-cols-[250px_1fr] gap-6">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label>Mã giai đoạn</Label>
                   <Input
                     value={formData.stage_key}
                     onChange={(e) => setFormData((prev: any) => ({ ...prev, stage_key: e.target.value }))}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Tên hiển thị</Label>
                   <Input
                     value={formData.stage_label}
                     onChange={(e) => setFormData((prev: any) => ({ ...prev, stage_label: e.target.value }))}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Màu sắc</Label>
                   <div className="flex items-center gap-2">
                     <div 
                       className="w-8 h-8 rounded border-2 border-border"
                       style={{ backgroundColor: formData.stage_color }}
                     />
                     <Input
                       type="color"
                       value={formData.stage_color}
                       onChange={(e) => setFormData((prev: any) => ({ ...prev, stage_color: e.target.value }))}
                       className="w-16 h-8 p-1 cursor-pointer"
                     />
                   </div>
                   <div className="grid grid-cols-5 gap-2 mt-2">
                     {colorOptions.map((color) => (
                       <button
                         key={color}
                         type="button"
                         className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                           formData.stage_color === color ? 'border-primary border-4' : 'border-border'
                         }`}
                         style={{ backgroundColor: color }}
                         onClick={() => setFormData((prev: any) => ({ ...prev, stage_color: color }))}
                       />
                     ))}
                   </div>
                 </div>
               </div>
               <div className="space-y-2">
                 <Label>Mô tả chi tiết</Label>
                 <Textarea
                   value={formData.stage_description}
                   onChange={(e) => setFormData((prev: any) => ({ ...prev, stage_description: e.target.value }))}
                   placeholder="Nhập mô tả chi tiết cho giai đoạn này..."
                   rows={6}
                 />
               </div>
             </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, is_active: checked }))}
                />
                <Label>Hoạt động</Label>
              </div>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" onClick={() => onSave(stage.id)}>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[auto_200px_1fr_auto] gap-4 items-start">
            <div {...attributes} {...listeners} className="cursor-move pt-1">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{stage.stage_label}</h3>
                <div 
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: stage.stage_color }}
                  title="Màu giai đoạn"
                />
              </div>
              <p className="text-sm text-muted-foreground">Mã: {stage.stage_key}</p>
              {!stage.is_active && (
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  Không hoạt động
                </Badge>
              )}
            </div>
            
            <div className="min-h-0">
              {stage.stage_description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{stage.stage_description}</p>
              )}
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(stage)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SalesFunnelStages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setPageInfo } = usePageContext();
  
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [formData, setFormData] = useState({
    stage_key: "",
    stage_label: "",
    stage_description: "",
    stage_order: 0,
    stage_color: "#3b82f6",
    is_active: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


  useEffect(() => {
    setPageInfo("Cấu hình phễu", "Cấu hình các giai đoạn trong quy trình bán hàng");
  }, [setPageInfo]);

  useEffect(() => {
    if (user) {
      fetchStages();
    }
  }, [user]);

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_funnel_stages')
        .select('*')
        .order('stage_order');

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách giai đoạn",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (stageId?: string) => {
    try {
      if (stageId) {
        // Update existing stage
        const { error } = await supabase
          .from('sales_funnel_stages')
          .update(formData)
          .eq('id', stageId);

        if (error) throw error;
        setEditingId(null);
      } else {
        // Create new stage
        const { error } = await supabase
          .from('sales_funnel_stages')
          .insert([formData]);

        if (error) throw error;
        setIsAddingNew(false);
      }

      toast({
        title: "Thành công",
        description: stageId ? "Đã cập nhật giai đoạn" : "Đã tạo giai đoạn mới",
      });

      fetchStages();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (stage: Stage) => {
    setFormData({
      stage_key: stage.stage_key,
      stage_label: stage.stage_label,
      stage_description: stage.stage_description || "",
      stage_order: stage.stage_order,
      stage_color: stage.stage_color,
      is_active: stage.is_active,
    });
    setEditingId(stage.id);
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsAddingNew(true);
    setEditingId(null);
  };

  const resetForm = () => {
    setFormData({
      stage_key: "",
      stage_label: "",
      stage_description: "",
      stage_order: stages.length > 0 ? Math.max(...stages.map(s => s.stage_order)) + 1 : 1,
      stage_color: "#3b82f6",
      is_active: true,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
    resetForm();
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = stages.findIndex(stage => stage.id === active.id);
      const newIndex = stages.findIndex(stage => stage.id === over.id);
      
      const newStages = arrayMove(stages, oldIndex, newIndex);
      
      // Update stage orders
      const updatedStages = newStages.map((stage, index) => ({
        ...stage,
        stage_order: index + 1
      }));
      
      setStages(updatedStages);
      
      // Update database with new orders
      try {
        const updates = updatedStages.map(stage => 
          supabase
            .from('sales_funnel_stages')
            .update({ stage_order: stage.stage_order })
            .eq('id', stage.id)
        );
        
        await Promise.all(updates);
        
        toast({
          title: "Thành công",
          description: "Đã cập nhật thứ tự giai đoạn",
        });
      } catch (error) {
        toast({
          title: "Lỗi", 
          description: "Không thể cập nhật thứ tự giai đoạn",
          variant: "destructive",
        });
        // Revert changes on error
        fetchStages();
      }
    }
  };

  const colorOptions = [
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Yellow
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#84cc16", // Lime
    "#ec4899", // Pink
    "#6b7280", // Gray
  ];

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
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate("/")}>
                Trang chủ
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Cấu hình phễu</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <Button onClick={handleAddNew} disabled={isAddingNew}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm giai đoạn
        </Button>
      </div>

      <div className="space-y-4">
        {isAddingNew && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Thêm giai đoạn mới
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[250px_1fr] gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mã giai đoạn</Label>
                    <Input
                      value={formData.stage_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, stage_key: e.target.value }))}
                      placeholder="vd: prospect"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tên hiển thị</Label>
                    <Input
                      value={formData.stage_label}
                      onChange={(e) => setFormData(prev => ({ ...prev, stage_label: e.target.value }))}
                      placeholder="vd: Tiềm năng"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Màu sắc</Label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded border-2 border-border"
                        style={{ backgroundColor: formData.stage_color }}
                      />
                      <Input
                        type="color"
                        value={formData.stage_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, stage_color: e.target.value }))}
                        className="w-16 h-8 p-1 cursor-pointer"
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                            formData.stage_color === color ? 'border-primary border-4' : 'border-border'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData(prev => ({ ...prev, stage_color: color }))}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mô tả chi tiết</Label>
                  <Textarea
                    value={formData.stage_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, stage_description: e.target.value }))}
                    placeholder="Nhập mô tả chi tiết cho giai đoạn này..."
                    rows={6}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Hoạt động</Label>
                </div>
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" onClick={() => handleSave()}>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Hủy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {stages.map((stage) => (
              <SortableStageItem
                key={stage.id}
                stage={stage}
                isEditing={editingId === stage.id}
                onEdit={handleEdit}
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
                onCancel={handleCancel}
                colorOptions={colorOptions}
              />
            ))}
          </SortableContext>
        </DndContext>

        {stages.length === 0 && !isAddingNew && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có giai đoạn nào</h3>
            <p className="text-muted-foreground mb-4">
              Bắt đầu bằng cách thêm giai đoạn đầu tiên cho phễu bán hàng
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm giai đoạn đầu tiên
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesFunnelStages;