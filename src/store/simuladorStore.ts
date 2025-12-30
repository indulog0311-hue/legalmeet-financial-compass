import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  CatalogoItem, 
  ParametrosMacroEconomicos, 
  ConfiguracionModelo,
  ConfiguracionVolumenes,
  TasasCrecimientoSKU
} from '@/types/catalogo';
import { 
  INGRESOS_CATALOG, 
  COSTOS_DIRECTOS_CATALOG, 
  GASTOS_OPEX_CATALOG, 
  IMPUESTOS_CATALOG,
  INVERSIONES_CATALOG
} from '@/lib/constants/catalogoMaestro';

// ============ PARÁMETROS MACRO 2026-2031 (Movido aquí para evitar dependencia circular) ============
export const PARAMETROS_MACRO_DEFAULT: ParametrosMacroEconomicos[] = [
  { año: 2026, inflacionPct: 4.5, trm: 4200, tasaRentaPct: 35, tasaIVAPct: 19, tasaBanrepPct: 9.0, salarioMinimo: 1600000, uxoEstimado: 50000 },
  { año: 2027, inflacionPct: 4.0, trm: 4300, tasaRentaPct: 35, tasaIVAPct: 19, tasaBanrepPct: 8.0, salarioMinimo: 1664000, uxoEstimado: 52000 },
  { año: 2028, inflacionPct: 3.5, trm: 4350, tasaRentaPct: 35, tasaIVAPct: 19, tasaBanrepPct: 7.5, salarioMinimo: 1722000, uxoEstimado: 53800 },
  { año: 2029, inflacionPct: 3.2, trm: 4400, tasaRentaPct: 35, tasaIVAPct: 19, tasaBanrepPct: 7.0, salarioMinimo: 1777000, uxoEstimado: 55600 },
  { año: 2030, inflacionPct: 3.0, trm: 4450, tasaRentaPct: 35, tasaIVAPct: 19, tasaBanrepPct: 6.5, salarioMinimo: 1830000, uxoEstimado: 57300 },
  { año: 2031, inflacionPct: 3.0, trm: 4500, tasaRentaPct: 35, tasaIVAPct: 19, tasaBanrepPct: 6.0, salarioMinimo: 1885000, uxoEstimado: 59000 }
];

// ============ CONFIGURACIÓN VOLÚMENES POR DEFECTO ============
const DEFAULT_CONFIG_VOLUMENES: ConfiguracionVolumenes = {
  volumenInicialPorSKU: 5, // Empieza con 5 por cada ING
  tasaCrecimientoDefault: 0.06, // 6% mensual por defecto
  tasasPorSKU: {} // Tasas personalizadas por SKU
};

// ============ CONFIGURACIÓN POR DEFECTO ============
const DEFAULT_CONFIG: ConfiguracionModelo = {
  añoInicio: 2026,
  añoFin: 2031,
  capitalInicial: 500000000, // 500M COP
  metaGrowthAnual: 0.30, // 30%
  mixPagoDigital: 0.70, // 70% digital
  tasaChurnMensual: 0.05, // 5%
  diasCartera: 5,
  diasProveedores: 30
};

// ============ FUNCIÓN PARA GENERAR VOLÚMENES INICIALES ============
const generarVolumenesIniciales = (
  skus: string[],
  configVolumenes: ConfiguracionVolumenes,
  años: number[]
): Record<number, Record<string, Record<number, number>>> => {
  const volumenes: Record<number, Record<string, Record<number, number>>> = {};
  
  años.forEach(año => {
    volumenes[año] = {};
    skus.forEach(sku => {
      volumenes[año][sku] = {};
      const tasaCrecimiento = configVolumenes.tasasPorSKU[sku] ?? configVolumenes.tasaCrecimientoDefault;
      
      for (let mes = 1; mes <= 12; mes++) {
        // Calcular meses transcurridos desde el inicio
        const mesesDesdeInicio = (año - 2026) * 12 + (mes - 1);
        // Volumen = volumenInicial * (1 + tasa)^meses
        const volumen = Math.round(
          configVolumenes.volumenInicialPorSKU * Math.pow(1 + tasaCrecimiento, mesesDesdeInicio)
        );
        volumenes[año][sku][mes] = volumen;
      }
    });
  });
  
  return volumenes;
};

// ============ STORE INTERFACE ============
interface SimuladorState {
  // Catálogo (editable)
  catalogoIngresos: CatalogoItem[];
  catalogoCostos: CatalogoItem[];
  catalogoOPEX: CatalogoItem[];
  catalogoImpuestos: CatalogoItem[];
  
  // Parámetros Macro (editables)
  parametrosMacro: ParametrosMacroEconomicos[];
  
  // Configuración del modelo
  config: ConfiguracionModelo;
  
  // Configuración de volúmenes
  configVolumenes: ConfiguracionVolumenes;
  
  // Volúmenes proyectados por SKU y mes (para cada año)
  volumenes: Record<number, Record<string, Record<number, number>>>; // año -> sku -> mes -> volumen
  
  // Precios personalizados (override del catálogo)
  preciosPersonalizados: Record<string, number>; // sku -> precio
  
  // Estado de la simulación
  simulacionActiva: boolean;
  ultimaActualizacion: string | null;
  
  // Actions
  cargarCatalogoDesdeCSV: (csv: string) => { success: boolean; errores: string[] };
  actualizarItemCatalogo: (codigo: string, cambios: Partial<CatalogoItem>) => void;
  actualizarParametroMacro: (año: number, cambios: Partial<ParametrosMacroEconomicos>) => void;
  actualizarConfig: (cambios: Partial<ConfiguracionModelo>) => void;
  actualizarVolumen: (año: number, sku: string, mes: number, volumen: number) => void;
  actualizarPrecio: (sku: string, precio: number) => void;
  actualizarTasaCrecimientoSKU: (sku: string, tasa: number) => void;
  actualizarConfigVolumenes: (cambios: Partial<ConfiguracionVolumenes>) => void;
  regenerarVolumenes: () => void;
  resetearCatalogo: () => void;
  limpiarTodo: () => void; // Nuevo: limpia cache, datos y estado
  iniciarSimulacion: () => void;
  
  // Getters
  getCatalogoCompleto: () => CatalogoItem[];
  getVolumenesAño: (año: number) => Record<string, Record<number, number>>;
  getPrecioEfectivo: (sku: string) => number;
  getTasaCrecimientoSKU: (sku: string) => number;
}

// SKUs de ingresos por defecto
const SKUS_INGRESOS = INGRESOS_CATALOG.map(i => i.codigo);
const AÑOS_DEFAULT = [2026, 2027, 2028, 2029, 2030, 2031];

export const useSimuladorStore = create<SimuladorState>()(
  persist(
    (set, get) => ({
      // Initial state
      catalogoIngresos: [...INGRESOS_CATALOG],
      catalogoCostos: [...COSTOS_DIRECTOS_CATALOG],
      catalogoOPEX: [...GASTOS_OPEX_CATALOG],
      catalogoImpuestos: [...IMPUESTOS_CATALOG],
      parametrosMacro: [...PARAMETROS_MACRO_DEFAULT],
      config: { ...DEFAULT_CONFIG },
      configVolumenes: { ...DEFAULT_CONFIG_VOLUMENES },
      volumenes: generarVolumenesIniciales(SKUS_INGRESOS, DEFAULT_CONFIG_VOLUMENES, AÑOS_DEFAULT),
      preciosPersonalizados: {},
      simulacionActiva: false,
      ultimaActualizacion: null,
      
      // Cargar catálogo desde CSV
      cargarCatalogoDesdeCSV: (csv: string) => {
        const errores: string[] = [];
        const lineas = csv.trim().split('\n');
        
        if (lineas.length < 2) {
          return { success: false, errores: ['El archivo CSV está vacío o no tiene datos'] };
        }
        
        const nuevosCatalogos: {
          ingresos: CatalogoItem[];
          costos: CatalogoItem[];
          opex: CatalogoItem[];
          impuestos: CatalogoItem[];
        } = { ingresos: [], costos: [], opex: [], impuestos: [] };
        
        for (let i = 1; i < lineas.length; i++) {
          const valores = lineas[i].split(',').map(v => v.trim());
          
          if (valores.length < 8) {
            errores.push(`Línea ${i + 1}: datos incompletos`);
            continue;
          }
          
          try {
            const tipo = valores[2]?.toLowerCase() || '';
            const item: CatalogoItem = {
              codigo: valores[0] || '',
              concepto: valores[1] || '',
              tipo: tipo as CatalogoItem['tipo'],
              categoria: valores[3] as CatalogoItem['categoria'],
              subCategoria: valores[4] || '',
              driver: valores[8] || '',
              valorUnitario: parseFloat(valores[6]?.replace(/[^0-9.-]/g, '') || '0'),
              frecuencia: valores[5] as CatalogoItem['frecuencia'],
              cuentaPUC: valores[9] || '',
              observacion: valores[10] || '',
              activo: valores[11]?.toUpperCase() === 'TRUE',
              gravaIVA: false,
              tasaIVA: 0,
              vinculadoA: undefined,
              esPorcentaje: valores[7]?.toUpperCase() === 'TRUE'
            };
            
            // Clasificar por código
            if (item.codigo.startsWith('ING-')) {
              nuevosCatalogos.ingresos.push(item);
            } else if (item.codigo.startsWith('C-VAR-')) {
              nuevosCatalogos.costos.push(item);
            } else if (item.codigo.startsWith('G-')) {
              nuevosCatalogos.opex.push(item);
            } else if (item.codigo.startsWith('IMP-')) {
              nuevosCatalogos.impuestos.push(item);
            } else {
              errores.push(`Línea ${i + 1}: código '${item.codigo}' no reconocido`);
            }
          } catch (e) {
            errores.push(`Línea ${i + 1}: error de formato`);
          }
        }
        
        if (nuevosCatalogos.ingresos.length === 0 && nuevosCatalogos.costos.length === 0) {
          return { success: false, errores: ['No se encontraron items válidos en el CSV'] };
        }
        
        // Regenerar volúmenes con los nuevos SKUs
        const nuevosSkus = nuevosCatalogos.ingresos.length > 0 
          ? nuevosCatalogos.ingresos.map(i => i.codigo)
          : SKUS_INGRESOS;
        
        set({
          catalogoIngresos: nuevosCatalogos.ingresos.length > 0 ? nuevosCatalogos.ingresos : get().catalogoIngresos,
          catalogoCostos: nuevosCatalogos.costos.length > 0 ? nuevosCatalogos.costos : get().catalogoCostos,
          catalogoOPEX: nuevosCatalogos.opex.length > 0 ? nuevosCatalogos.opex : get().catalogoOPEX,
          catalogoImpuestos: nuevosCatalogos.impuestos.length > 0 ? nuevosCatalogos.impuestos : get().catalogoImpuestos,
          volumenes: generarVolumenesIniciales(nuevosSkus, get().configVolumenes, AÑOS_DEFAULT),
          ultimaActualizacion: new Date().toISOString()
        });
        
        return { success: true, errores };
      },
      
      // Actualizar item del catálogo
      actualizarItemCatalogo: (codigo: string, cambios: Partial<CatalogoItem>) => {
        set(state => {
          const actualizarLista = (lista: CatalogoItem[]) =>
            lista.map(item => item.codigo === codigo ? { ...item, ...cambios } : item);
          
          return {
            catalogoIngresos: actualizarLista(state.catalogoIngresos),
            catalogoCostos: actualizarLista(state.catalogoCostos),
            catalogoOPEX: actualizarLista(state.catalogoOPEX),
            catalogoImpuestos: actualizarLista(state.catalogoImpuestos),
            ultimaActualizacion: new Date().toISOString()
          };
        });
      },
      
      // Actualizar parámetro macro
      actualizarParametroMacro: (año: number, cambios: Partial<ParametrosMacroEconomicos>) => {
        set(state => ({
          parametrosMacro: state.parametrosMacro.map(p =>
            p.año === año ? { ...p, ...cambios } : p
          ),
          ultimaActualizacion: new Date().toISOString()
        }));
      },
      
      // Actualizar configuración
      actualizarConfig: (cambios: Partial<ConfiguracionModelo>) => {
        set(state => {
          const nuevaConfig = { ...state.config, ...cambios };
          
          // Si cambiaron los años, regenerar volúmenes para incluir todos los años del rango
          const añosCambiaron = cambios.añoInicio !== undefined || cambios.añoFin !== undefined;
          
          if (añosCambiaron) {
            const skus = state.catalogoIngresos.map(i => i.codigo);
            const años = [];
            for (let a = nuevaConfig.añoInicio; a <= nuevaConfig.añoFin; a++) {
              años.push(a);
            }
            
            // Generar nuevos volúmenes para los años que faltan
            const nuevosVolumenes = { ...state.volumenes };
            años.forEach(año => {
              if (!nuevosVolumenes[año]) {
                nuevosVolumenes[año] = {};
                skus.forEach(sku => {
                  nuevosVolumenes[año][sku] = {};
                  const tasaCrecimiento = state.configVolumenes.tasasPorSKU[sku] ?? state.configVolumenes.tasaCrecimientoDefault;
                  
                  for (let mes = 1; mes <= 12; mes++) {
                    const mesesDesdeInicio = (año - 2026) * 12 + (mes - 1);
                    const volumen = Math.round(
                      state.configVolumenes.volumenInicialPorSKU * Math.pow(1 + tasaCrecimiento, mesesDesdeInicio)
                    );
                    nuevosVolumenes[año][sku][mes] = volumen;
                  }
                });
              }
            });
            
            return {
              config: nuevaConfig,
              volumenes: nuevosVolumenes,
              ultimaActualizacion: new Date().toISOString()
            };
          }
          
          return {
            config: nuevaConfig,
            ultimaActualizacion: new Date().toISOString()
          };
        });
      },
      
      // Actualizar volumen específico
      actualizarVolumen: (año: number, sku: string, mes: number, volumen: number) => {
        set(state => ({
          volumenes: {
            ...state.volumenes,
            [año]: {
              ...state.volumenes[año],
              [sku]: {
                ...state.volumenes[año]?.[sku],
                [mes]: volumen
              }
            }
          },
          ultimaActualizacion: new Date().toISOString()
        }));
      },
      
      // Actualizar precio personalizado
      actualizarPrecio: (sku: string, precio: number) => {
        set(state => ({
          preciosPersonalizados: {
            ...state.preciosPersonalizados,
            [sku]: precio
          },
          ultimaActualizacion: new Date().toISOString()
        }));
      },
      
      // Actualizar tasa de crecimiento por SKU
      actualizarTasaCrecimientoSKU: (sku: string, tasa: number) => {
        set(state => {
          const nuevaConfig = {
            ...state.configVolumenes,
            tasasPorSKU: {
              ...state.configVolumenes.tasasPorSKU,
              [sku]: tasa
            }
          };
          // Regenerar volúmenes con la nueva tasa
          const skus = state.catalogoIngresos.map(i => i.codigo);
          return {
            configVolumenes: nuevaConfig,
            volumenes: generarVolumenesIniciales(skus, nuevaConfig, AÑOS_DEFAULT),
            ultimaActualizacion: new Date().toISOString()
          };
        });
      },
      
      // Actualizar configuración de volúmenes
      actualizarConfigVolumenes: (cambios: Partial<ConfiguracionVolumenes>) => {
        set(state => {
          const nuevaConfig = { ...state.configVolumenes, ...cambios };
          const skus = state.catalogoIngresos.map(i => i.codigo);
          return {
            configVolumenes: nuevaConfig,
            volumenes: generarVolumenesIniciales(skus, nuevaConfig, AÑOS_DEFAULT),
            ultimaActualizacion: new Date().toISOString()
          };
        });
      },
      
      // Regenerar volúmenes basado en configuración actual
      regenerarVolumenes: () => {
        set(state => {
          const skus = state.catalogoIngresos.map(i => i.codigo);
          return {
            volumenes: generarVolumenesIniciales(skus, state.configVolumenes, AÑOS_DEFAULT),
            ultimaActualizacion: new Date().toISOString()
          };
        });
      },
      
      // Resetear catálogo a valores por defecto
      resetearCatalogo: () => {
        set({
          catalogoIngresos: [...INGRESOS_CATALOG],
          catalogoCostos: [...COSTOS_DIRECTOS_CATALOG],
          catalogoOPEX: [...GASTOS_OPEX_CATALOG],
          catalogoImpuestos: [...IMPUESTOS_CATALOG],
          parametrosMacro: [...PARAMETROS_MACRO_DEFAULT],
          config: { ...DEFAULT_CONFIG },
          configVolumenes: { ...DEFAULT_CONFIG_VOLUMENES },
          volumenes: generarVolumenesIniciales(SKUS_INGRESOS, DEFAULT_CONFIG_VOLUMENES, AÑOS_DEFAULT),
          preciosPersonalizados: {},
          simulacionActiva: false,
          ultimaActualizacion: new Date().toISOString()
        });
      },
      
      // NUEVO: Limpiar todo (cache, localStorage, estado)
      limpiarTodo: () => {
        // Limpiar localStorage
        localStorage.removeItem('legalmeet-simulador');
        localStorage.removeItem('legalmeet-financial-model');
        
        // Resetear a estado inicial limpio
        set({
          catalogoIngresos: [...INGRESOS_CATALOG],
          catalogoCostos: [...COSTOS_DIRECTOS_CATALOG],
          catalogoOPEX: [...GASTOS_OPEX_CATALOG],
          catalogoImpuestos: [...IMPUESTOS_CATALOG],
          parametrosMacro: [...PARAMETROS_MACRO_DEFAULT],
          config: { ...DEFAULT_CONFIG },
          configVolumenes: { ...DEFAULT_CONFIG_VOLUMENES },
          volumenes: generarVolumenesIniciales(SKUS_INGRESOS, DEFAULT_CONFIG_VOLUMENES, AÑOS_DEFAULT),
          preciosPersonalizados: {},
          simulacionActiva: false,
          ultimaActualizacion: null
        });
      },
      
      // Iniciar simulación
      iniciarSimulacion: () => {
        set({
          simulacionActiva: true,
          ultimaActualizacion: new Date().toISOString()
        });
      },
      
      // Getters
      getCatalogoCompleto: () => {
        const state = get();
        return [
          ...state.catalogoIngresos,
          ...state.catalogoCostos,
          ...state.catalogoOPEX,
          ...state.catalogoImpuestos
        ];
      },
      
      getVolumenesAño: (año: number) => {
        const state = get();
        return state.volumenes[año] || {};
      },
      
      getPrecioEfectivo: (sku: string) => {
        const state = get();
        if (state.preciosPersonalizados[sku] !== undefined) {
          return state.preciosPersonalizados[sku];
        }
        const item = state.catalogoIngresos.find(i => i.codigo === sku);
        return item?.valorUnitario || 0;
      },
      
      getTasaCrecimientoSKU: (sku: string) => {
        const state = get();
        return state.configVolumenes.tasasPorSKU[sku] ?? state.configVolumenes.tasaCrecimientoDefault;
      }
    }),
    {
      name: 'legalmeet-simulador',
      partialize: (state) => ({
        catalogoIngresos: state.catalogoIngresos,
        catalogoCostos: state.catalogoCostos,
        catalogoOPEX: state.catalogoOPEX,
        catalogoImpuestos: state.catalogoImpuestos,
        parametrosMacro: state.parametrosMacro,
        config: state.config,
        configVolumenes: state.configVolumenes,
        volumenes: state.volumenes,
        preciosPersonalizados: state.preciosPersonalizados,
        simulacionActiva: state.simulacionActiva,
        ultimaActualizacion: state.ultimaActualizacion
      })
    }
  )
);
