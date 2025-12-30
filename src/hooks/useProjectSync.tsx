import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSimuladorStore } from '@/store/simuladorStore';
import { toast } from 'sonner';

const AUTO_SAVE_INTERVAL = 30000; // 30 segundos

interface Project {
  id: string;
  name: string;
  description: string | null;
  year_start: number;
  year_end: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProjectConfiguration {
  capital_inicial: number | null;
  volumen_mensual_inicial: number | null;
  crecimiento_mensual: number | null;
  mix_digital: number | null;
  mix_rural: number | null;
  churn_mensual: number | null;
  dias_cartera: number | null;
  dias_proveedores: number | null;
  num_empleados: number | null;
  salario_promedio: number | null;
  marketing_pct: number | null;
  cac: number | null;
}

interface UseProjectSyncReturn {
  // Estado
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  isSyncing: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: Date | null;
  error: string | null;
  
  // Acciones de proyecto
  createProject: (name: string, description?: string) => Promise<Project | null>;
  selectProject: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  
  // Sincronización
  syncToDatabase: () => Promise<void>;
  loadFromDatabase: () => Promise<void>;
  
  // Auto-guardado
  enableAutoSave: boolean;
  setEnableAutoSave: (enabled: boolean) => void;
  
  // Volúmenes
  saveVolume: (skuCode: string, year: number, month: number, volume: number) => Promise<void>;
  
  // Precios
  savePrice: (skuCode: string, price: number) => Promise<void>;
}

export function useProjectSync(): UseProjectSyncReturn {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enableAutoSave, setEnableAutoSave] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  // Referencias para auto-guardado
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedStateRef = useRef<string>('');

  const { 
    config, 
    configVolumenes,
    volumenes,
    preciosPersonalizados,
    ultimaActualizacion,
    actualizarConfig,
    actualizarVolumen,
    actualizarPrecio,
    actualizarConfigVolumenes
  } = useSimuladorStore();
  
  // Detectar cambios no guardados
  useEffect(() => {
    const currentState = JSON.stringify({
      config,
      configVolumenes,
      volumenes,
      preciosPersonalizados
    });
    
    if (lastSyncedStateRef.current && currentState !== lastSyncedStateRef.current) {
      setHasUnsavedChanges(true);
    }
  }, [config, configVolumenes, volumenes, preciosPersonalizados]);

  // Cargar proyectos del usuario
  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setActiveProject(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProjects(data || []);

      // Seleccionar el proyecto activo o el más reciente
      const active = data?.find(p => p.is_active) || data?.[0];
      if (active) {
        setActiveProject(active);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Error al cargar proyectos');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Cargar proyectos al inicio
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Crear nuevo proyecto
  const createProject = useCallback(async (name: string, description?: string): Promise<Project | null> => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      setIsSyncing(true);

      // Desactivar otros proyectos
      await supabase
        .from('projects')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Crear nuevo proyecto
      const { data: project, error: createError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          year_start: config.añoInicio,
          year_end: config.añoFin,
          is_active: true
        })
        .select()
        .single();

      if (createError) throw createError;

      // Crear configuración inicial
      const { error: configError } = await supabase
        .from('project_configurations')
        .insert({
          project_id: project.id,
          capital_inicial: config.capitalInicial,
          volumen_mensual_inicial: configVolumenes.volumenInicialPorSKU,
          crecimiento_mensual: configVolumenes.tasaCrecimientoDefault,
          mix_digital: config.mixPagoDigital,
          churn_mensual: config.tasaChurnMensual,
          dias_cartera: config.diasCartera,
          dias_proveedores: config.diasProveedores
        });

      if (configError) throw configError;

      setActiveProject(project);
      await loadProjects();
      toast.success('Proyecto creado');
      return project;
    } catch (err) {
      console.error('Error creating project:', err);
      toast.error('Error al crear proyecto');
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [user, config, configVolumenes, loadProjects]);

  // Seleccionar proyecto
  const selectProject = useCallback(async (projectId: string) => {
    if (!user) return;

    try {
      setIsSyncing(true);

      // Desactivar otros proyectos
      await supabase
        .from('projects')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activar el seleccionado
      const { data: project, error: selectError } = await supabase
        .from('projects')
        .update({ is_active: true })
        .eq('id', projectId)
        .select()
        .single();

      if (selectError) throw selectError;

      setActiveProject(project);

      // Cargar datos del proyecto
      await loadFromDatabase();
      toast.success(`Proyecto "${project.name}" activado`);
    } catch (err) {
      console.error('Error selecting project:', err);
      toast.error('Error al seleccionar proyecto');
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Actualizar proyecto
  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    try {
      setIsSyncing(true);

      const { error: updateError } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (updateError) throw updateError;

      await loadProjects();
      toast.success('Proyecto actualizado');
    } catch (err) {
      console.error('Error updating project:', err);
      toast.error('Error al actualizar proyecto');
    } finally {
      setIsSyncing(false);
    }
  }, [loadProjects]);

  // Eliminar proyecto
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setIsSyncing(true);

      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (deleteError) throw deleteError;

      if (activeProject?.id === projectId) {
        setActiveProject(null);
      }

      await loadProjects();
      toast.success('Proyecto eliminado');
    } catch (err) {
      console.error('Error deleting project:', err);
      toast.error('Error al eliminar proyecto');
    } finally {
      setIsSyncing(false);
    }
  }, [activeProject, loadProjects]);

  // Sincronizar estado local a la base de datos
  const syncToDatabase = useCallback(async () => {
    if (!activeProject) {
      toast.error('No hay proyecto activo');
      return;
    }

    try {
      setIsSyncing(true);

      // Actualizar años del proyecto
      await supabase
        .from('projects')
        .update({
          year_start: config.añoInicio,
          year_end: config.añoFin
        })
        .eq('id', activeProject.id);

      // Actualizar configuración
      await supabase
        .from('project_configurations')
        .upsert({
          project_id: activeProject.id,
          capital_inicial: config.capitalInicial,
          volumen_mensual_inicial: configVolumenes.volumenInicialPorSKU,
          crecimiento_mensual: configVolumenes.tasaCrecimientoDefault,
          mix_digital: config.mixPagoDigital,
          churn_mensual: config.tasaChurnMensual,
          dias_cartera: config.diasCartera,
          dias_proveedores: config.diasProveedores
        }, { onConflict: 'project_id' });

      // Sincronizar volúmenes
      const volumeRecords: Array<{
        project_id: string;
        sku_code: string;
        year: number;
        month: number;
        volume: number;
      }> = [];

      Object.entries(volumenes).forEach(([yearStr, skuData]) => {
        const year = parseInt(yearStr);
        Object.entries(skuData).forEach(([skuCode, monthData]) => {
          Object.entries(monthData).forEach(([monthStr, volume]) => {
            volumeRecords.push({
              project_id: activeProject.id,
              sku_code: skuCode,
              year,
              month: parseInt(monthStr),
              volume: volume as number
            });
          });
        });
      });

      // Eliminar volúmenes existentes y guardar nuevos
      await supabase
        .from('project_volumes')
        .delete()
        .eq('project_id', activeProject.id);

      if (volumeRecords.length > 0) {
        // Insertar en lotes de 500
        for (let i = 0; i < volumeRecords.length; i += 500) {
          const batch = volumeRecords.slice(i, i + 500);
          await supabase.from('project_volumes').insert(batch);
        }
      }

      // Sincronizar precios personalizados
      await supabase
        .from('project_sku_prices')
        .delete()
        .eq('project_id', activeProject.id);

      const priceRecords = Object.entries(preciosPersonalizados).map(([skuCode, price]) => ({
        project_id: activeProject.id,
        sku_code: skuCode,
        custom_price: price
      }));

      if (priceRecords.length > 0) {
        await supabase.from('project_sku_prices').insert(priceRecords);
      }

      // Marcar como guardado
      const currentState = JSON.stringify({
        config,
        configVolumenes,
        volumenes,
        preciosPersonalizados
      });
      lastSyncedStateRef.current = currentState;
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      
      toast.success('Datos sincronizados');
    } catch (err) {
      console.error('Error syncing to database:', err);
      toast.error('Error al sincronizar');
    } finally {
      setIsSyncing(false);
    }
  }, [activeProject, config, configVolumenes, volumenes, preciosPersonalizados]);

  // Cargar datos desde la base de datos
  const loadFromDatabase = useCallback(async () => {
    if (!activeProject) return;

    try {
      setIsLoading(true);

      // Cargar configuración
      const { data: configData } = await supabase
        .from('project_configurations')
        .select('*')
        .eq('project_id', activeProject.id)
        .maybeSingle();

      if (configData) {
        actualizarConfig({
          añoInicio: activeProject.year_start,
          añoFin: activeProject.year_end,
          capitalInicial: configData.capital_inicial || 500000000,
          mixPagoDigital: configData.mix_digital || 0.7,
          tasaChurnMensual: configData.churn_mensual || 0.05,
          diasCartera: configData.dias_cartera || 5,
          diasProveedores: configData.dias_proveedores || 30
        });

        actualizarConfigVolumenes({
          volumenInicialPorSKU: configData.volumen_mensual_inicial || 5,
          tasaCrecimientoDefault: configData.crecimiento_mensual || 0.06
        });
      }

      // Cargar volúmenes
      const { data: volumeData } = await supabase
        .from('project_volumes')
        .select('*')
        .eq('project_id', activeProject.id);

      if (volumeData && volumeData.length > 0) {
        volumeData.forEach(vol => {
          actualizarVolumen(vol.year, vol.sku_code, vol.month, vol.volume);
        });
      }

      // Cargar precios personalizados
      const { data: priceData } = await supabase
        .from('project_sku_prices')
        .select('*')
        .eq('project_id', activeProject.id);

      if (priceData && priceData.length > 0) {
        priceData.forEach(price => {
          actualizarPrecio(price.sku_code, price.custom_price);
        });
      }
    } catch (err) {
      console.error('Error loading from database:', err);
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, actualizarConfig, actualizarConfigVolumenes, actualizarVolumen, actualizarPrecio]);

  // Cargar datos cuando cambie el proyecto activo
  useEffect(() => {
    if (activeProject) {
      loadFromDatabase();
    }
  }, [activeProject?.id]);

  // Guardar volumen individual
  const saveVolume = useCallback(async (skuCode: string, year: number, month: number, volume: number) => {
    if (!activeProject) return;

    try {
      await supabase
        .from('project_volumes')
        .upsert({
          project_id: activeProject.id,
          sku_code: skuCode,
          year,
          month,
          volume
        }, { onConflict: 'project_id,sku_code,year,month' });

      actualizarVolumen(year, skuCode, month, volume);
    } catch (err) {
      console.error('Error saving volume:', err);
    }
  }, [activeProject, actualizarVolumen]);

  // Guardar precio individual
  const savePrice = useCallback(async (skuCode: string, price: number) => {
    if (!activeProject) return;

    try {
      await supabase
        .from('project_sku_prices')
        .upsert({
          project_id: activeProject.id,
          sku_code: skuCode,
          custom_price: price
        }, { onConflict: 'project_id,sku_code' });

      actualizarPrecio(skuCode, price);
    } catch (err) {
      console.error('Error saving price:', err);
    }
  }, [activeProject, actualizarPrecio]);

  // Auto-guardado silencioso (sin toast)
  const autoSave = useCallback(async () => {
    if (!activeProject || !hasUnsavedChanges || isSyncing) return;

    try {
      setIsSyncing(true);

      // Actualizar años del proyecto
      await supabase
        .from('projects')
        .update({
          year_start: config.añoInicio,
          year_end: config.añoFin
        })
        .eq('id', activeProject.id);

      // Actualizar configuración
      await supabase
        .from('project_configurations')
        .upsert({
          project_id: activeProject.id,
          capital_inicial: config.capitalInicial,
          volumen_mensual_inicial: configVolumenes.volumenInicialPorSKU,
          crecimiento_mensual: configVolumenes.tasaCrecimientoDefault,
          mix_digital: config.mixPagoDigital,
          churn_mensual: config.tasaChurnMensual,
          dias_cartera: config.diasCartera,
          dias_proveedores: config.diasProveedores
        }, { onConflict: 'project_id' });

      // Sincronizar volúmenes
      const volumeRecords: Array<{
        project_id: string;
        sku_code: string;
        year: number;
        month: number;
        volume: number;
      }> = [];

      Object.entries(volumenes).forEach(([yearStr, skuData]) => {
        const year = parseInt(yearStr);
        Object.entries(skuData).forEach(([skuCode, monthData]) => {
          Object.entries(monthData).forEach(([monthStr, volume]) => {
            volumeRecords.push({
              project_id: activeProject.id,
              sku_code: skuCode,
              year,
              month: parseInt(monthStr),
              volume: volume as number
            });
          });
        });
      });

      await supabase
        .from('project_volumes')
        .delete()
        .eq('project_id', activeProject.id);

      if (volumeRecords.length > 0) {
        for (let i = 0; i < volumeRecords.length; i += 500) {
          const batch = volumeRecords.slice(i, i + 500);
          await supabase.from('project_volumes').insert(batch);
        }
      }

      await supabase
        .from('project_sku_prices')
        .delete()
        .eq('project_id', activeProject.id);

      const priceRecords = Object.entries(preciosPersonalizados).map(([skuCode, price]) => ({
        project_id: activeProject.id,
        sku_code: skuCode,
        custom_price: price
      }));

      if (priceRecords.length > 0) {
        await supabase.from('project_sku_prices').insert(priceRecords);
      }

      const currentState = JSON.stringify({
        config,
        configVolumenes,
        volumenes,
        preciosPersonalizados
      });
      lastSyncedStateRef.current = currentState;
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
    } catch (err) {
      console.error('Auto-save error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [activeProject, hasUnsavedChanges, isSyncing, config, configVolumenes, volumenes, preciosPersonalizados]);

  // Configurar auto-guardado
  useEffect(() => {
    if (enableAutoSave && activeProject && hasUnsavedChanges) {
      autoSaveTimerRef.current = setInterval(() => {
        autoSave();
      }, AUTO_SAVE_INTERVAL);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [enableAutoSave, activeProject, hasUnsavedChanges, autoSave]);

  return {
    projects,
    activeProject,
    isLoading,
    isSyncing,
    hasUnsavedChanges,
    lastSavedAt,
    error,
    createProject,
    selectProject,
    updateProject,
    deleteProject,
    syncToDatabase,
    loadFromDatabase,
    enableAutoSave,
    setEnableAutoSave,
    saveVolume,
    savePrice
  };
}
