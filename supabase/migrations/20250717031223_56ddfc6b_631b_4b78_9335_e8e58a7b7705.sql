-- Add entity_type enum to distinguish between personnel and organization fields
CREATE TYPE public.entity_type AS ENUM ('personnel', 'organization');

-- Add entity_type column to field_groups table
ALTER TABLE public.field_groups 
ADD COLUMN entity_type entity_type NOT NULL DEFAULT 'personnel';

-- Add entity_type column to field_definitions table  
ALTER TABLE public.field_definitions
ADD COLUMN entity_type entity_type NOT NULL DEFAULT 'personnel';

-- Update existing sample data to be explicitly for personnel
UPDATE public.field_groups SET entity_type = 'personnel';
UPDATE public.field_definitions SET entity_type = 'personnel';

-- Insert sample data for organization fields
INSERT INTO public.field_groups (name, description, display_order, entity_type) VALUES
('Thông tin cơ bản', 'Thông tin cơ bản về tổ chức', 1, 'organization'),
('Thông tin kinh doanh', 'Thông tin về hoạt động kinh doanh', 2, 'organization');

-- Get the field group IDs for organization
DO $$ 
DECLARE
    basic_info_group_id uuid;
    business_info_group_id uuid;
BEGIN
    SELECT id INTO basic_info_group_id FROM public.field_groups WHERE name = 'Thông tin cơ bản' AND entity_type = 'organization';
    SELECT id INTO business_info_group_id FROM public.field_groups WHERE name = 'Thông tin kinh doanh' AND entity_type = 'organization';
    
    -- Insert sample field definitions for organization
    INSERT INTO public.field_definitions (field_group_id, field_key, field_label, field_type, is_required, display_order, entity_type) VALUES
    (basic_info_group_id, 'founding_year', 'Năm thành lập', 'number', false, 1, 'organization'),
    (basic_info_group_id, 'employee_count', 'Số lượng nhân viên', 'select_single', false, 2, 'organization'),
    (basic_info_group_id, 'main_products', 'Sản phẩm chính', 'textarea', false, 3, 'organization'),
    (business_info_group_id, 'annual_revenue', 'Doanh thu hàng năm', 'select_single', false, 1, 'organization'),
    (business_info_group_id, 'market_focus', 'Thị trường trọng tâm', 'select_multiple', false, 2, 'organization'),
    (business_info_group_id, 'competitor_analysis', 'Phân tích đối thủ', 'textarea', false, 3, 'organization');
    
    -- Update field configs for organization fields
    UPDATE public.field_definitions 
    SET field_config = '{"options": ["1-10", "11-50", "51-200", "201-500", "500+"]}'::jsonb
    WHERE field_key = 'employee_count' AND entity_type = 'organization';
    
    UPDATE public.field_definitions 
    SET field_config = '{"options": ["< 1 tỷ", "1-5 tỷ", "5-10 tỷ", "10-50 tỷ", "50+ tỷ"]}'::jsonb
    WHERE field_key = 'annual_revenue' AND entity_type = 'organization';
    
    UPDATE public.field_definitions 
    SET field_config = '{"options": ["Trong nước", "Xuất khẩu", "Cả hai", "Khu vực", "Toàn cầu"]}'::jsonb
    WHERE field_key = 'market_focus' AND entity_type = 'organization';
END $$;