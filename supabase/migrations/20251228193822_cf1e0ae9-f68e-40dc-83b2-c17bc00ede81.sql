-- ============================================
-- LEGALMEET DATABASE SCHEMA V1.0
-- Profiles, Projects, Configurations
-- ============================================

-- 1. Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  company TEXT,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mi Proyecto',
  description TEXT,
  year_start INTEGER NOT NULL DEFAULT 2026,
  year_end INTEGER NOT NULL DEFAULT 2031,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create project configurations table
CREATE TABLE public.project_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  capital_inicial DECIMAL(15,2) DEFAULT 500000000,
  volumen_mensual_inicial INTEGER DEFAULT 100,
  crecimiento_mensual DECIMAL(5,4) DEFAULT 0.10,
  mix_digital DECIMAL(3,2) DEFAULT 0.70,
  mix_rural DECIMAL(3,2) DEFAULT 0.30,
  churn_mensual DECIMAL(5,4) DEFAULT 0.05,
  num_empleados INTEGER DEFAULT 3,
  salario_promedio DECIMAL(12,2) DEFAULT 5000000,
  marketing_pct DECIMAL(5,2) DEFAULT 15,
  cac DECIMAL(12,2) DEFAULT 100000,
  dias_cartera INTEGER DEFAULT 30,
  dias_proveedores INTEGER DEFAULT 45,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create SKU volumes table (for projected volumes)
CREATE TABLE public.project_volumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sku_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  volume INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, sku_code, year, month)
);

-- 5. Create custom SKU prices table
CREATE TABLE public.project_sku_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sku_code TEXT NOT NULL,
  custom_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, sku_code)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sku_prices ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects: Users can only access their own projects
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- Project configurations: Access through project ownership
CREATE POLICY "Users can view own project configs" ON public.project_configurations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can create own project configs" ON public.project_configurations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can update own project configs" ON public.project_configurations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own project configs" ON public.project_configurations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
  );

-- Project volumes: Access through project ownership
CREATE POLICY "Users can view own project volumes" ON public.project_volumes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own project volumes" ON public.project_volumes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
  );

-- Project SKU prices: Access through project ownership
CREATE POLICY "Users can view own project prices" ON public.project_sku_prices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own project prices" ON public.project_sku_prices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_configurations_updated_at
  BEFORE UPDATE ON public.project_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_sku_prices_updated_at
  BEFORE UPDATE ON public.project_sku_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_project_configurations_project_id ON public.project_configurations(project_id);
CREATE INDEX idx_project_volumes_project_id ON public.project_volumes(project_id);
CREATE INDEX idx_project_volumes_lookup ON public.project_volumes(project_id, sku_code, year, month);
CREATE INDEX idx_project_sku_prices_project_id ON public.project_sku_prices(project_id);