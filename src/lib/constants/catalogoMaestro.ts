/**
 * CATÁLOGO MAESTRO V5.0 - LEGALMEET COLOMBIA
 * Fuente de Verdad para el Sistema Operativo Financiero
 * HARDCODED INITIAL STATE - Dataset CSV precargado
 * PROHIBIDO inventar precios o costos. Todo cálculo referencia estos códigos.
 */

import { CatalogoItem } from '@/types/catalogo';

// ============ 1. INGRESOS (REVENUE) ============
export const INGRESOS_CATALOG: CatalogoItem[] = [
  {
    codigo: 'ING-001',
    concepto: 'Consulta Legal Estándar',
    tipo: 'ingreso',
    categoria: 'Ingresos',
    subCategoria: 'B2C',
    driver: '# Consultas Pagadas',
    valorUnitario: 150000,
    frecuencia: 'Por Tx',
    cuentaPUC: '413536',
    observacion: 'Techo de mercado. Base del volumen.',
    activo: true,
    gravaIVA: false,
    tasaIVA: 0
  },
  {
    codigo: 'ING-002',
    concepto: 'S.O.S. Legal (Botón Pánico)',
    tipo: 'ingreso',
    categoria: 'Ingresos',
    subCategoria: 'Premium',
    driver: '# Consultas SOS',
    valorUnitario: 200000,
    frecuencia: 'Por Tx',
    cuentaPUC: '413536',
    observacion: 'Margen alto. Urgencia inmediata.',
    activo: true,
    gravaIVA: false,
    tasaIVA: 0
  },
  {
    codigo: 'ING-003',
    concepto: 'Validación Flash (Semáforo)',
    tipo: 'ingreso',
    categoria: 'Ingresos',
    subCategoria: 'Micro-servicio',
    driver: '# Validaciones',
    valorUnitario: 30000,
    frecuencia: 'Por Tx',
    cuentaPUC: '413536',
    observacion: 'Producto gancho.',
    activo: true,
    gravaIVA: false,
    tasaIVA: 0
  },
  {
    codigo: 'ING-004',
    concepto: 'Descarga Documento (Wizard)',
    tipo: 'ingreso',
    categoria: 'Ingresos',
    subCategoria: 'SaaS',
    driver: '# Descargas',
    valorUnitario: 15000,
    frecuencia: 'Por Doc',
    cuentaPUC: '413520',
    observacion: 'Rentabilidad 95%.',
    activo: true,
    gravaIVA: true,
    tasaIVA: 19
  },
  {
    codigo: 'ING-005',
    concepto: 'Suscripción Abogado Pro',
    tipo: 'ingreso',
    categoria: 'Ingresos',
    subCategoria: 'Recurrente',
    driver: '# Suscriptores',
    valorUnitario: 150000,
    frecuencia: 'Mensual',
    cuentaPUC: '413520',
    observacion: 'MRR.',
    activo: true,
    gravaIVA: true,
    tasaIVA: 19
  },
  {
    codigo: 'ING-006',
    concepto: 'Plan Corporativo (B2B)',
    tipo: 'ingreso',
    categoria: 'Ingresos',
    subCategoria: 'Recurrente',
    driver: '# Empresas',
    valorUnitario: 5000000,
    frecuencia: 'Mensual',
    cuentaPUC: '413536',
    observacion: 'Ticket alto.',
    activo: true,
    gravaIVA: false,
    tasaIVA: 0
  },
  {
    codigo: 'ING-007',
    concepto: 'Fee Onboarding Abogado',
    tipo: 'ingreso',
    categoria: 'Ingresos',
    subCategoria: 'Setup',
    driver: '# Nuevos Abogados',
    valorUnitario: 50000,
    frecuencia: 'Única Vez',
    cuentaPUC: '413595',
    observacion: 'Filtro seguridad.',
    activo: true,
    gravaIVA: true,
    tasaIVA: 19
  }
];

// ============ 2. COSTOS DIRECTOS (UNIT ECONOMICS) ============
export const COSTOS_DIRECTOS_CATALOG: CatalogoItem[] = [
  {
    codigo: 'C-VAR-01',
    concepto: 'Pago Neto Abogado Estándar',
    tipo: 'costo_variable',
    categoria: 'Costo Venta',
    subCategoria: 'Escrow',
    driver: 'Por Consulta Estándar',
    valorUnitario: 100000,
    frecuencia: 'Por Tx',
    cuentaPUC: '281505',
    observacion: 'Neto Garantizado.',
    activo: true,
    vinculadoA: 'ING-001'
  },
  {
    codigo: 'C-VAR-02',
    concepto: 'Pago Neto Abogado S.O.S.',
    tipo: 'costo_variable',
    categoria: 'Costo Venta',
    subCategoria: 'Escrow',
    driver: 'Por Consulta SOS',
    valorUnitario: 120000,
    frecuencia: 'Por Tx',
    cuentaPUC: '281505',
    observacion: 'Pago Premium.',
    activo: true,
    vinculadoA: 'ING-002'
  },
  {
    codigo: 'C-VAR-03',
    concepto: 'Pago Neto Abogado Flash',
    tipo: 'costo_variable',
    categoria: 'Costo Venta',
    subCategoria: 'Escrow',
    driver: 'Por Validación',
    valorUnitario: 15000,
    frecuencia: 'Por Tx',
    cuentaPUC: '281505',
    observacion: 'Micro-pago.',
    activo: true,
    vinculadoA: 'ING-003'
  },
  {
    codigo: 'C-VAR-04',
    concepto: 'Asunción ReteFuente (Gross-up)',
    tipo: 'costo_variable',
    categoria: 'Costo Venta',
    subCategoria: 'Tributario',
    driver: '% Mix Personas Naturales',
    valorUnitario: 12360,
    frecuencia: 'Por Tx',
    cuentaPUC: '236515',
    observacion: 'Costo oculto LegalMeet.',
    activo: true,
    esCostoOculto: true
  },
  {
    codigo: 'C-VAR-05',
    concepto: 'GMF 4x1000 Dispersión',
    tipo: 'costo_variable',
    categoria: 'Costo Venta',
    subCategoria: 'Financiero',
    driver: 'Valor Dispersado',
    valorUnitario: 0.004,
    frecuencia: 'Por Tx',
    cuentaPUC: '530505',
    observacion: 'Impuesto egreso.',
    activo: true,
    esPorcentaje: true
  },
  {
    codigo: 'C-VAR-06',
    concepto: 'Pasarela Wompi (Digital)',
    tipo: 'costo_variable',
    categoria: 'Costo Venta',
    subCategoria: 'Financiero',
    driver: '% Pagos Digitales',
    valorUnitario: 6500,
    frecuencia: 'Por Tx',
    cuentaPUC: '530515',
    observacion: 'Costo Digital.',
    activo: true,
    diasIngreso: 2
  },
  {
    codigo: 'C-VAR-07',
    concepto: 'Recaudo Efectivo (Rural)',
    tipo: 'costo_variable',
    categoria: 'Costo Venta',
    subCategoria: 'Financiero',
    driver: '% Pagos Efectivo',
    valorUnitario: 7200,
    frecuencia: 'Por Tx',
    cuentaPUC: '530515',
    observacion: 'Costo Rural.',
    activo: true,
    diasIngreso: 5
  },
  {
    codigo: 'C-VAR-08',
    concepto: 'WhatsApp API (Meta)',
    tipo: 'costo_variable',
    categoria: 'Costo Venta',
    subCategoria: 'Tech',
    driver: 'Conversaciones (UIC)',
    valorUnitario: 250,
    frecuencia: 'Por Caso',
    cuentaPUC: '519595',
    observacion: 'Costo Meta.',
    activo: true
  },
  {
    codigo: 'C-VAR-09',
    concepto: 'SMS Transaccional',
    tipo: 'costo_variable',
    categoria: 'Costo Venta',
    subCategoria: 'Tech',
    driver: 'Mensajes Enviados',
    valorUnitario: 150,
    frecuencia: 'Por SMS',
    cuentaPUC: '519525',
    observacion: 'Costo Rural Tech.',
    activo: true,
    vinculadoA: 'C-VAR-07'
  },
  {
    codigo: 'C-VAR-10',
    concepto: 'Consulta Listas (SAGRILAFT)',
    tipo: 'costo_variable',
    categoria: 'Costo Venta',
    subCategoria: 'Compliance',
    driver: 'Nuevos Usuarios/Abogados',
    valorUnitario: 3000,
    frecuencia: 'Por Verificación',
    cuentaPUC: '519595',
    observacion: 'Anti-Lavado.',
    activo: true
  }
];

// ============ 3. GASTOS OPEX (ADMIN/TECH/NÓMINA) ============
export const GASTOS_OPEX_CATALOG: CatalogoItem[] = [
  // === NÓMINA ===
  {
    codigo: 'G-ADM-01',
    concepto: 'CEO / Estratega',
    tipo: 'gasto',
    categoria: 'Nómina',
    subCategoria: 'Dirección',
    driver: 'Salario Base Mensual',
    valorUnitario: 12000000,
    frecuencia: 'Mensual',
    cuentaPUC: '510506',
    observacion: 'Liderazgo.',
    activo: true,
    esNomina: true
  },
  {
    codigo: 'G-ADM-02',
    concepto: 'CTO / Líder Tech',
    tipo: 'gasto',
    categoria: 'Nómina',
    subCategoria: 'Tecnología',
    driver: 'Salario Integral',
    valorUnitario: 10000000,
    frecuencia: 'Mensual',
    cuentaPUC: '510506',
    observacion: 'Arquitectura y desarrollo.',
    activo: true,
    esNomina: true
  },
  {
    codigo: 'G-ADM-03',
    concepto: 'Soporte Operativo (Customer Success)',
    tipo: 'gasto',
    categoria: 'Nómina',
    subCategoria: 'Operaciones',
    driver: 'Salario Base',
    valorUnitario: 2500000,
    frecuencia: 'Mensual',
    cuentaPUC: '510506',
    observacion: 'Atención usuarios y abogados.',
    activo: true,
    esNomina: true
  },
  // === GASTOS ADMINISTRATIVOS ===
  {
    codigo: 'G-ADM-04',
    concepto: 'Contador Externo',
    tipo: 'gasto',
    categoria: 'Gastos Admin',
    subCategoria: 'Admin',
    driver: 'Honorarios',
    valorUnitario: 1200000,
    frecuencia: 'Mensual',
    cuentaPUC: '511020',
    observacion: 'Contabilidad y DIAN.',
    activo: true
  },
  {
    codigo: 'G-ADM-05',
    concepto: 'Oficial Cumplimiento (Sarlaft)',
    tipo: 'gasto',
    categoria: 'Gastos Admin',
    subCategoria: 'Compliance',
    driver: 'Honorarios',
    valorUnitario: 2000000,
    frecuencia: 'Mensual',
    cuentaPUC: '511030',
    observacion: 'Prevención lavado de activos.',
    activo: true
  },
  // === GASTOS TECH ===
  {
    codigo: 'G-TEC-01',
    concepto: 'Cloud Computing (Serverless)',
    tipo: 'gasto',
    categoria: 'Gastos Tech',
    subCategoria: 'Infraestructura',
    driver: 'Usuarios Activos (MAU)',
    valorUnitario: 400,
    frecuencia: 'Mensual',
    cuentaPUC: '519595',
    observacion: 'AWS Escala.',
    activo: true
  },
  {
    codigo: 'G-TEC-02',
    concepto: 'Herramientas SaaS (Jira/Slack)',
    tipo: 'gasto',
    categoria: 'Gastos Tech',
    subCategoria: 'Software',
    driver: 'Suscripción',
    valorUnitario: 1500000,
    frecuencia: 'Mensual',
    cuentaPUC: '519595',
    observacion: 'Productividad del equipo.',
    activo: true
  },
  // === MARKETING ===
  {
    codigo: 'G-MKT-01',
    concepto: 'Agencia Marketing / Pauta Fija',
    tipo: 'gasto',
    categoria: 'Marketing',
    subCategoria: 'Branding',
    driver: 'Fee Mensual',
    valorUnitario: 3000000,
    frecuencia: 'Mensual',
    cuentaPUC: '529505',
    observacion: 'Pauta digital y branding.',
    activo: true,
    esCAC: true
  }
];

// ============ 4. IMPUESTOS (FISCAL) ============
export const IMPUESTOS_CATALOG: CatalogoItem[] = [
  {
    codigo: 'IMP-001',
    concepto: 'Impuesto de Renta (Provisión)',
    tipo: 'impuesto',
    categoria: 'Impuestos',
    subCategoria: 'Nacional',
    driver: 'Utilidad Fiscal (Antes de Impuestos)',
    valorUnitario: 0.35,
    frecuencia: 'Anual',
    cuentaPUC: '540505',
    observacion: 'Tarifa General.',
    activo: true,
    esPorcentaje: true
  },
  {
    codigo: 'IMP-002',
    concepto: 'Industria y Comercio (ICA)',
    tipo: 'impuesto',
    categoria: 'Impuestos',
    subCategoria: 'Territorial',
    driver: 'Ingresos Brutos Totales',
    valorUnitario: 0.00966,
    frecuencia: 'Bimestral',
    cuentaPUC: '511505',
    observacion: 'Tarifa Bogotá.',
    activo: true,
    esPorcentaje: true
  },
  {
    codigo: 'IMP-003',
    concepto: 'GMF (4x1000) Movimientos Propios',
    tipo: 'impuesto',
    categoria: 'Impuestos',
    subCategoria: 'Financiero',
    driver: 'Gastos Operativos + Nómina',
    valorUnitario: 0.004,
    frecuencia: 'Mensual',
    cuentaPUC: '530505',
    observacion: 'GMF Admin.',
    activo: true,
    esPorcentaje: true
  }
];

// ============ 5. INVERSIONES (CAPEX) ============
export const INVERSIONES_CATALOG: CatalogoItem[] = [
  {
    codigo: 'INV-001',
    concepto: 'Desarrollo MVP (Software Factory)',
    tipo: 'capex',
    categoria: 'Inversión',
    subCategoria: 'Intangible',
    driver: 'Proyecto',
    valorUnitario: 70000000,
    frecuencia: 'Única Vez',
    cuentaPUC: '16',
    observacion: 'Construcción Backend.',
    activo: true
  },
  {
    codigo: 'INV-002',
    concepto: 'Estructuración Legal y TyC',
    tipo: 'capex',
    categoria: 'Inversión',
    subCategoria: 'Legal',
    driver: 'Proyecto',
    valorUnitario: 8000000,
    frecuencia: 'Única Vez',
    cuentaPUC: '5110',
    observacion: 'Contratos.',
    activo: true
  }
];

// ============ CATÁLOGO COMPLETO ============
export const CATALOGO_MAESTRO: CatalogoItem[] = [
  ...INGRESOS_CATALOG,
  ...COSTOS_DIRECTOS_CATALOG,
  ...GASTOS_OPEX_CATALOG,
  ...IMPUESTOS_CATALOG,
  ...INVERSIONES_CATALOG
];

// ============ HELPERS ============
export const getItemByCodigo = (codigo: string): CatalogoItem | undefined =>
  CATALOGO_MAESTRO.find(item => item.codigo === codigo);

export const getIngresosByCodigo = (codigo: string): CatalogoItem | undefined =>
  INGRESOS_CATALOG.find(item => item.codigo === codigo);

export const getCostoVinculado = (codigoIngreso: string): CatalogoItem | undefined =>
  COSTOS_DIRECTOS_CATALOG.find(item => item.vinculadoA === codigoIngreso);

/**
 * Obtiene un costo del catálogo por su código
 * @param codigo - Código del costo (ej: 'C-VAR-06')
 */
export const getCostoByCode = (codigo: string): CatalogoItem | undefined =>
  COSTOS_DIRECTOS_CATALOG.find(item => item.codigo === codigo);

/**
 * Obtiene un gasto OPEX del catálogo por su código
 * @param codigo - Código del gasto (ej: 'G-ADM-01')
 */
export const getGastoByCode = (codigo: string): CatalogoItem | undefined =>
  GASTOS_OPEX_CATALOG.find(item => item.codigo === codigo);

export const getNominaTotal = (): number =>
  GASTOS_OPEX_CATALOG
    .filter(item => item.esNomina)
    .reduce((sum, item) => sum + item.valorUnitario, 0);

export const getImpuestoPorCodigo = (codigo: string): CatalogoItem | undefined =>
  IMPUESTOS_CATALOG.find(item => item.codigo === codigo);

export const getItemsActivos = (): CatalogoItem[] =>
  CATALOGO_MAESTRO.filter(item => item.activo);

export const getItemsPorTipo = (tipo: CatalogoItem['tipo']): CatalogoItem[] =>
  CATALOGO_MAESTRO.filter(item => item.tipo === tipo && item.activo);

export const getInversionTotal = (): number =>
  INVERSIONES_CATALOG.reduce((sum, item) => sum + item.valorUnitario, 0);

/**
 * Valida que todos los costos vinculados existan en el catálogo de ingresos
 * Usar en tests y startup para verificar integridad
 */
export const validarVinculaciones = (): { valido: boolean; errores: string[] } => {
  const errores: string[] = [];
  
  COSTOS_DIRECTOS_CATALOG.forEach(costo => {
    if (costo.vinculadoA) {
      const ingresoExiste = INGRESOS_CATALOG.some(ing => ing.codigo === costo.vinculadoA);
      if (!ingresoExiste) {
        errores.push(`Costo ${costo.codigo} vinculado a ${costo.vinculadoA} inexistente`);
      }
    }
  });
  
  return {
    valido: errores.length === 0,
    errores
  };
};

// Constantes derivadas
export const TASA_RENTA = 0.35; // 35%
export const TASA_ICA_BOGOTA = 0.00966; // 0.966%
export const TASA_IVA = 0.19; // 19%
export const GMF_RATE = 0.004; // 4x1000
export const RETEFUENTE_ABOGADOS = 0.11; // 11%

// Factor prestacional Colombia (para nómina NO integral)
export const FACTOR_PRESTACIONAL = 1.52;

// Calendario laboral Colombia 2026 (base)
export const DIAS_HABILES_2026: Record<number, number> = {
  1: 20,  // Enero
  2: 19,  // Febrero
  3: 21,  // Marzo
  4: 19,  // Abril (Semana Santa)
  5: 20,  // Mayo
  6: 20,  // Junio
  7: 21,  // Julio
  8: 20,  // Agosto
  9: 22,  // Septiembre
  10: 20, // Octubre
  11: 19, // Noviembre
  12: 17  // Diciembre
};

export const TOTAL_DIAS_HABILES_2026 = Object.values(DIAS_HABILES_2026).reduce((a, b) => a + b, 0);

// Función para obtener días hábiles 2026-2031 (Ley Emiliani simplificada)
export const getDiasHabilesExtendido = (año: number, mes: number): number => {
  // Patrón base de Colombia (usamos 2026 como referencia)
  const patronBase = DIAS_HABILES_2026[mes as keyof typeof DIAS_HABILES_2026] || 20;
  // Para años futuros, asumimos estabilidad en días hábiles
  // (variación real es de ±1-2 días por festivos móviles)
  return patronBase;
};

// Total nómina mensual del catálogo OPEX
export const getNominaTotalCalculado = (): number => {
  return GASTOS_OPEX_CATALOG
    .filter(item => item.esNomina)
    .reduce((sum, item) => sum + item.valorUnitario, 0);
};

// Total OPEX fijo mensual (sin cloud variable)
export const getOPEXFijoMensual = (): number => {
  return GASTOS_OPEX_CATALOG
    .filter(item => item.activo && item.driver !== 'Usuarios Activos (MAU)')
    .reduce((sum, item) => sum + item.valorUnitario, 0);
};
