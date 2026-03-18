-- Tạo enum cho các loại dữ liệu
CREATE TYPE public.organization_type AS ENUM ('b2b', 'b2g');
CREATE TYPE public.contact_method AS ENUM ('phone', 'email', 'meeting', 'social_media', 'other');
CREATE TYPE public.sales_stage AS ENUM ('prospect', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');

-- Bảng sản phẩm/dịch vụ
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price DECIMAL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bảng nhân viên kinh doanh nội bộ (profiles)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bảng cộng tác viên bán hàng
CREATE TABLE public.collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    commission_rate DECIMAL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bảng tổ chức khách hàng
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type organization_type NOT NULL,
    industry TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    tax_code TEXT,
    description TEXT,
    assigned_sales_person_id UUID REFERENCES public.profiles(id),
    sales_stage sales_stage DEFAULT 'prospect',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bảng nhân sự key của tổ chức
CREATE TABLE public.key_personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    position TEXT,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    birth_date DATE,
    notes TEXT,
    assigned_sales_person_id UUID REFERENCES public.profiles(id),
    next_contact_date DATE,
    next_contact_objective TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bảng quan tâm sản phẩm của nhân sự key
CREATE TABLE public.personnel_product_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID REFERENCES public.key_personnel(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    interest_level INTEGER CHECK (interest_level >= 1 AND interest_level <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(personnel_id, product_id)
);

-- Bảng lịch sử liên hệ
CREATE TABLE public.contact_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID REFERENCES public.key_personnel(id) ON DELETE CASCADE,
    contact_method contact_method NOT NULL,
    contact_date TIMESTAMP WITH TIME ZONE NOT NULL,
    summary TEXT NOT NULL,
    details TEXT,
    outcome TEXT,
    next_action TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS trên tất cả bảng
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_product_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies cho profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies cho các bảng khác (tất cả user đã đăng nhập đều có thể truy cập)
CREATE POLICY "Authenticated users can view products" ON public.products
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage products" ON public.products
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view collaborators" ON public.collaborators
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage collaborators" ON public.collaborators
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view organizations" ON public.organizations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage organizations" ON public.organizations
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view key personnel" ON public.key_personnel
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage key personnel" ON public.key_personnel
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view product interests" ON public.personnel_product_interests
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage product interests" ON public.personnel_product_interests
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view contact history" ON public.contact_history
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage contact history" ON public.contact_history
    FOR ALL TO authenticated USING (true);

-- Tạo function và trigger cho updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng trigger cho các bảng
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collaborators_updated_at
    BEFORE UPDATE ON public.collaborators
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_key_personnel_updated_at
    BEFORE UPDATE ON public.key_personnel
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger tự động tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();