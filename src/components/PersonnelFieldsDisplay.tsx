import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";

interface FieldDefinition {
  id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  display_order: number;
  field_config: any;
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

interface PersonnelFieldsDisplayProps {
  personnelId: string;
}

export function PersonnelFieldsDisplay({ personnelId }: PersonnelFieldsDisplayProps) {
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [fieldValues, setFieldValues] = useState<FieldValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFieldsAndValues();
  }, [personnelId]);

  const fetchFieldsAndValues = async () => {
    try {
      // Fetch field definitions for personnel
      const { data: fieldsData, error: fieldsError } = await supabase
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

      if (fieldsError) throw fieldsError;

      // Fetch field values for this personnel
      const { data: valuesData, error: valuesError } = await supabase
        .from('personnel_field_values')
        .select('*')
        .eq('personnel_id', personnelId);

      if (valuesError) throw valuesError;

      setFieldDefinitions(fieldsData || []);
      setFieldValues(valuesData || []);
    } catch (error) {
      console.error('Error fetching field data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFieldValue = (fieldId: string, fieldType: string) => {
    const value = fieldValues.find(v => v.field_definition_id === fieldId);
    if (!value) return null;

    switch (fieldType) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
      case 'url':
        return value.text_value;
      case 'number':
        return value.number_value;
      case 'date':
        return value.date_value;
      case 'boolean':
        return value.boolean_value;
      case 'select_single':
      case 'select_multiple':
        return value.json_value;
      default:
        return value.text_value;
    }
  };

  const formatFieldValue = (value: any, fieldType: string, fieldConfig: any) => {
    if (value === null || value === undefined || value === '') return '-';

    switch (fieldType) {
      case 'boolean':
        return value ? 'Có' : 'Không';
      case 'date':
        return new Date(value).toLocaleDateString('vi-VN');
      case 'select_single':
        if (fieldConfig?.options) {
          const option = fieldConfig.options.find((opt: any) => opt.value === value);
          return option?.label || value;
        }
        return value;
      case 'select_multiple':
        if (Array.isArray(value) && fieldConfig?.options) {
          return value.map(v => {
            const option = fieldConfig.options.find((opt: any) => opt.value === v);
            return option?.label || v;
          }).join(', ');
        }
        return Array.isArray(value) ? value.join(', ') : value;
      case 'number':
        return value.toLocaleString('vi-VN');
      default:
        return value;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Đang tải thông tin mở rộng...</span>
        </CardContent>
      </Card>
    );
  }

  // Group fields by field_groups and filter out fields without values
  const groupedFields = fieldDefinitions.reduce((acc, field) => {
    const value = getFieldValue(field.id, field.field_type);
    const hasValue = value !== null && value !== undefined && value !== '';
    
    // Only include fields that have values
    if (!hasValue) return acc;

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

  // Sort groups by order and only include groups that have fields with values
  const sortedGroups = Object.values(groupedFields)
    .filter(group => group.fields.length > 0)
    .sort((a, b) => a.order - b.order);

  if (fieldDefinitions.length === 0 || sortedGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thông tin mở rộng</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Chưa có thông tin mở rộng nào.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin mở rộng</CardTitle>
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
                    .map((field) => {
                      const value = getFieldValue(field.id, field.field_type);
                      const hasValue = value !== null && value !== undefined && value !== '';
                      
                      return (
                        <div key={field.id} className="grid grid-cols-3 gap-4 py-2 border-b last:border-b-0">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {field.field_label}
                            {field.is_required && (
                              <span className="text-red-500">*</span>
                            )}
                          </div>
                          <div className="col-span-2 text-sm">
                            {hasValue ? (
                              <span className="text-foreground">
                                {formatFieldValue(value, field.field_type, field.field_config)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Chưa có thông tin</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}