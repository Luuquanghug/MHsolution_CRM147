-- Create enum for field data types
CREATE TYPE field_data_type AS ENUM (
  'text',
  'number', 
  'date',
  'boolean',
  'select_single',
  'select_multiple',
  'textarea',
  'email',
  'phone',
  'url'
);

-- Create table for field groups (nhóm trường)
CREATE TABLE public.field_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for field definitions (định nghĩa trường)
CREATE TABLE public.field_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_group_id UUID REFERENCES public.field_groups(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL, -- unique identifier for the field
  field_label TEXT NOT NULL, -- display name
  field_type field_data_type NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Field configuration (JSON for flexibility)
  field_config JSONB DEFAULT '{}', -- For select options, validation rules, etc.
  
  -- Constraints and validation
  min_length INTEGER,
  max_length INTEGER,
  min_value NUMERIC,
  max_value NUMERIC,
  regex_pattern TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(field_key)
);

-- Create table for personnel field values (giá trị động)
CREATE TABLE public.personnel_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  personnel_id UUID REFERENCES public.key_personnel(id) ON DELETE CASCADE,
  field_definition_id UUID REFERENCES public.field_definitions(id) ON DELETE CASCADE,
  
  -- Store values in different columns based on type
  text_value TEXT,
  number_value NUMERIC,
  date_value DATE,
  boolean_value BOOLEAN,
  json_value JSONB, -- For complex data like multiple selections
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(personnel_id, field_definition_id)
);

-- Enable RLS on all tables
ALTER TABLE public.field_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_field_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for field_groups
CREATE POLICY "All authenticated users can view field groups" 
ON public.field_groups 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Admins can manage field groups" 
ON public.field_groups 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND user_roles = 'admin'::app_role
));

-- RLS Policies for field_definitions
CREATE POLICY "All authenticated users can view field definitions" 
ON public.field_definitions 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Admins can manage field definitions" 
ON public.field_definitions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND user_roles = 'admin'::app_role
));

-- RLS Policies for personnel_field_values
CREATE POLICY "All authenticated users can view personnel field values" 
ON public.personnel_field_values 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "All authenticated users can manage personnel field values" 
ON public.personnel_field_values 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

-- Create triggers for updated_at
CREATE TRIGGER update_field_groups_updated_at
  BEFORE UPDATE ON public.field_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_field_definitions_updated_at
  BEFORE UPDATE ON public.field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personnel_field_values_updated_at
  BEFORE UPDATE ON public.personnel_field_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample field groups
INSERT INTO public.field_groups (name, description, display_order) VALUES
('Thông tin định danh', 'Các thông tin cơ bản để xác định danh tính', 1),
('Hành vi & Mức độ quan tâm', 'Thông tin về sở thích và hành vi của khách hàng', 2),
('Thông tin liên hệ mở rộng', 'Các kênh liên hệ bổ sung', 3),
('Thông tin công việc', 'Chi tiết về công việc và nghề nghiệp', 4);

-- Insert sample field definitions
INSERT INTO public.field_definitions (field_group_id, field_key, field_label, field_type, is_required, display_order, field_config) VALUES
-- Thông tin định danh
((SELECT id FROM field_groups WHERE name = 'Thông tin định danh'), 'gender', 'Giới tính', 'select_single', false, 1, '{"options": [{"value": "male", "label": "Nam"}, {"value": "female", "label": "Nữ"}, {"value": "other", "label": "Khác"}]}'),
((SELECT id FROM field_groups WHERE name = 'Thông tin định danh'), 'marital_status', 'Tình trạng hôn nhân', 'select_single', false, 2, '{"options": [{"value": "single", "label": "Độc thân"}, {"value": "married", "label": "Đã kết hôn"}, {"value": "divorced", "label": "Đã ly hôn"}, {"value": "widowed", "label": "Góa phụ"}]}'),
((SELECT id FROM field_groups WHERE name = 'Thông tin định danh'), 'citizen_id', 'Căn cước công dân', 'text', false, 3, '{"placeholder": "Nhập số CCCD"}'),
((SELECT id FROM field_groups WHERE name = 'Thông tin định danh'), 'home_address', 'Địa chỉ nhà', 'textarea', false, 4, '{"placeholder": "Nhập địa chỉ chi tiết"}'),

-- Hành vi & Mức độ quan tâm  
((SELECT id FROM field_groups WHERE name = 'Hành vi & Mức độ quan tâm'), 'long_term_interests', 'Sở thích lâu dài', 'select_multiple', false, 1, '{"options": [{"value": "travel", "label": "Du lịch"}, {"value": "reading", "label": "Đọc sách"}, {"value": "sports", "label": "Thể thao"}, {"value": "music", "label": "Âm nhạc"}, {"value": "cooking", "label": "Nấu ăn"}]}'),
((SELECT id FROM field_groups WHERE name = 'Hành vi & Mức độ quan tâm'), 'current_interests', 'Quan tâm hiện tại', 'textarea', false, 2, '{"placeholder": "Mô tả những gì họ đang quan tâm"}'),
((SELECT id FROM field_groups WHERE name = 'Hành vi & Mức độ quan tâm'), 'recent_major_events', 'Sự kiện lớn gần đây', 'textarea', false, 3, '{"placeholder": "Các sự kiện quan trọng trong cuộc sống"}'),

-- Thông tin liên hệ mở rộng
((SELECT id FROM field_groups WHERE name = 'Thông tin liên hệ mở rộng'), 'social_media_facebook', 'Facebook', 'url', false, 1, '{"placeholder": "https://facebook.com/username"}'),
((SELECT id FROM field_groups WHERE name = 'Thông tin liên hệ mở rộng'), 'social_media_linkedin', 'LinkedIn', 'url', false, 2, '{"placeholder": "https://linkedin.com/in/username"}'),
((SELECT id FROM field_groups WHERE name = 'Thông tin liên hệ mở rộng'), 'emergency_contact', 'Liên hệ khẩn cấp', 'phone', false, 3, '{"placeholder": "Số điện thoại người thân"}'),

-- Thông tin công việc
((SELECT id FROM field_groups WHERE name = 'Thông tin công việc'), 'industry_experience', 'Kinh nghiệm ngành', 'number', false, 1, '{"unit": "năm", "min": 0, "max": 50}'),
((SELECT id FROM field_groups WHERE name = 'Thông tin công việc'), 'education_level', 'Trình độ học vấn', 'select_single', false, 2, '{"options": [{"value": "high_school", "label": "THPT"}, {"value": "college", "label": "Cao đẳng"}, {"value": "university", "label": "Đại học"}, {"value": "master", "label": "Thạc sĩ"}, {"value": "phd", "label": "Tiến sĩ"}]}'),
((SELECT id FROM field_groups WHERE name = 'Thông tin công việc'), 'previous_companies', 'Công ty đã làm việc', 'textarea', false, 3, '{"placeholder": "Danh sách các công ty đã từng làm việc"}');