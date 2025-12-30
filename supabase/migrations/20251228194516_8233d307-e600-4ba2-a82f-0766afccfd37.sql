-- Agregar constraint único para project_configurations
ALTER TABLE public.project_configurations 
ADD CONSTRAINT project_configurations_project_id_unique UNIQUE (project_id);

-- Agregar constraint único para project_volumes (combinación única)
ALTER TABLE public.project_volumes 
ADD CONSTRAINT project_volumes_unique_entry UNIQUE (project_id, sku_code, year, month);

-- Agregar constraint único para project_sku_prices
ALTER TABLE public.project_sku_prices 
ADD CONSTRAINT project_sku_prices_unique_entry UNIQUE (project_id, sku_code);