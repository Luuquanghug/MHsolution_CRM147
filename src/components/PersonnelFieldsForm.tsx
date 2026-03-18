import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface FieldDefinition {
  id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  display_order: number;
  field_config: any;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  regex_pattern?: string;
  field_groups?: {
    id: string;
    name: string;
    display_order: number;
  };
}

interface FieldValue {
  field_definition_id: string;
  text_value: string | null;
  number_value: number | null;
  date_value: string | null;
  boolean_value: boolean | null;
  json_value: any;
}

interface PersonnelFieldsFormProps {
  personnelId?: string; // Optional for new personnel
  onValuesChange?: (values: Record<string, any>) => void;
}

export function PersonnelFieldsForm({ personnelId, onValuesChange }: PersonnelFieldsFormProps) {
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (personnelId && fieldDefinitions.length > 0) {
      fetchFieldValues();
    }
  }, [personnelId, fieldDefinitions]);

  useEffect(() => {
    onValuesChange?.(fieldValues);
  }, [fieldValues, onValuesChange]);

  const fetchFields = async () => {
    try {
      const { data, error } = await supabase
        .from('field_definitions')
        .select(`
          *,
          field_groups (
            id,
            name,
            display_order
          )
        `)
        .eq('entity_type', 'personnel')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setFieldDefinitions(data || []);
    } catch (error) {
      console.error('Error fetching field definitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldValues = async () => {
    if (!personnelId) return;
    
    try {
      const { data, error } = await supabase
        .from('personnel_field_values')
        .select('*')
        .eq('personnel_id', personnelId);

      if (error) throw error;

      const valuesMap: Record<string, any> = {};
      data?.forEach(value => {
        const field = fieldDefinitions.find(f => f.id === value.field_definition_id);
        if (field) {
          switch (field.field_type) {
            case 'text':
            case 'textarea':
            case 'email':
            case 'phone':
            case 'url':
              valuesMap[field.id] = value.text_value;
              break;
            case 'number':
              valuesMap[field.id] = value.number_value;
              break;
            case 'date':
              valuesMap[field.id] = value.date_value;
              break;
            case 'boolean':
              valuesMap[field.id] = value.boolean_value;
              break;
            case 'select_single':
            case 'select_multiple':
              valuesMap[field.id] = value.json_value;
              break;
            default:
              valuesMap[field.id] = value.text_value;
          }
        }
      });

      setFieldValues(valuesMap);
    } catch (error) {
      console.error('Error fetching field values:', error);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const saveFieldValues = async () => {
    if (!personnelId) return;

    setSaving(true);
    try {
      // Delete existing values
      await supabase
        .from('personnel_field_values')
        .delete()
        .eq('personnel_id', personnelId);

      // Insert new values
      const valuesToInsert = Object.entries(fieldValues)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
        .map(([fieldId, value]) => {
          const field = fieldDefinitions.find(f => f.id === fieldId);
          if (!field) return null;

          const baseValue = {
            personnel_id: personnelId,
            field_definition_id: fieldId,
            text_value: null,
            number_value: null,
            date_value: null,
            boolean_value: null,
            json_value: null,
          };

          switch (field.field_type) {
            case 'text':
            case 'textarea':
            case 'email':
            case 'phone':
            case 'url':
              return { ...baseValue, text_value: value };
            case 'number':
              return { ...baseValue, number_value: Number(value) };
            case 'date':
              return { ...baseValue, date_value: value };
            case 'boolean':
              return { ...baseValue, boolean_value: Boolean(value) };
            case 'select_single':
            case 'select_multiple':
              return { ...baseValue, json_value: value };
            default:
              return { ...baseValue, text_value: String(value) };
          }
        })
        .filter(Boolean);

      if (valuesToInsert.length > 0) {
        const { error } = await supabase
          .from('personnel_field_values')
          .insert(valuesToInsert);

        if (error) throw error;
      }

      toast({
        title: "Thành công",
        description: "Đã lưu thông tin mở rộng",
      });
    } catch (error) {
      console.error('Error saving field values:', error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu thông tin mở rộng",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FieldDefinition) => {
    const value = fieldValues[field.id] || '';

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Nhập ${field.field_label.toLowerCase()}`}
            type={field.field_type === 'email' ? 'email' : field.field_type === 'url' ? 'url' : 'text'}
            pattern={field.regex_pattern || undefined}
            minLength={field.min_length || undefined}
            maxLength={field.max_length || undefined}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Nhập ${field.field_label.toLowerCase()}`}
            minLength={field.min_length || undefined}
            maxLength={field.max_length || undefined}
            rows={3}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value ? Number(e.target.value) : '')}
            placeholder={`Nhập ${field.field_label.toLowerCase()}`}
            min={field.min_value || undefined}
            max={field.max_value || undefined}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label>Có</Label>
          </div>
        );

      case 'select_single':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Chọn ${field.field_label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.field_config?.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'select_multiple':
        return (
          <div className="space-y-2">
            {field.field_config?.options?.map((option: any) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (checked) {
                      handleFieldChange(field.id, [...currentValues, option.value]);
                    } else {
                      handleFieldChange(field.id, currentValues.filter(v => v !== option.value));
                    }
                  }}
                />
                <Label>{option.label}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Nhập ${field.field_label.toLowerCase()}`}
          />
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Đang tải cấu hình trường...</span>
        </CardContent>
      </Card>
    );
  }

  if (fieldDefinitions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thông tin mở rộng</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Chưa có cấu hình trường thông tin mở rộng nào.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group fields by field_groups
  const groupedFields = fieldDefinitions.reduce((acc, field) => {
    const groupKey = field.field_groups?.id || 'ungrouped';
    const groupName = field.field_groups?.name || 'Thông tin khác';
    const groupOrder = field.field_groups?.display_order || 999;

    if (!acc[groupKey]) {
      acc[groupKey] = {
        id: groupKey,
        name: groupName,
        order: groupOrder,
        fields: []
      };
    }
    acc[groupKey].fields.push(field);
    return acc;
  }, {} as Record<string, { id: string; name: string; order: number; fields: FieldDefinition[] }>);

  // Sort groups by order
  const sortedGroups = Object.values(groupedFields).sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Thông tin mở rộng</CardTitle>
        {personnelId && (
          <Button
            onClick={saveFieldValues}
            disabled={saving}
            size="sm"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Lưu
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {sortedGroups.map((group) => (
            <AccordionItem key={group.id} value={group.id}>
              <AccordionTrigger className="text-left font-medium">
                {group.name}
                <Badge variant="secondary" className="ml-2">
                  {group.fields.length}
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {group.fields
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="flex items-center gap-2">
                          {field.field_label}
                          {field.is_required && (
                            <span className="text-red-500">*</span>
                          )}
                        </Label>
                        {renderField(field)}
                      </div>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}