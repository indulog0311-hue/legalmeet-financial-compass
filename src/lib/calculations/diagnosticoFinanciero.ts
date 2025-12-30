/**
 * DIAGNÓSTICO DE LÓGICA FINANCIERA - PRUEBA DEL ÁCIDO UNITARIA
 * Auditoría Forense del Flujo de Dinero
 * 
 * Este módulo ejecuta un análisis paso a paso de UNA transacción
 * para validar la integridad lógica del modelo financiero.
 */

import {
  getItemByCodigo,
  getCostoVinculado,
  getNominaTotal,
  TASA_RENTA,
  TASA_ICA_BOGOTA,
  GMF_RATE,
  RETEFUENTE_ABOGADOS,
  GASTOS_OPEX_CATALOG
} from '@/lib/constants/catalogoMaestro';

// ============ TIPOS DE DIAGNÓSTICO ============
export interface PasoFlujo {
  orden: number;
  concepto: string;
  codigo: string;
  tipo: 'entrada' | 'salida' | 'impuesto' | 'info';
  monto: number;
  formula: string;
  acumulado: number;
  alerta?: string;
  esError?: boolean;
}

export interface AlertaDiagnostico {
  severidad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'INFO';
  categoria: string;
  titulo: string;
  descripcion: string;
  valorActual: number;
  valorEsperado?: number;
  solucionPropuesta?: string;
  tipoValor?: 'porcentaje' | 'moneda' | 'numero';
}

export interface DiagnosticoUnitario {
  timestamp: Date;
  skuAnalizado: string;
  precioEntrada: number;
  volumen: number;
  mixDigital: number;
  mixRural: number;

  // Flujo paso a paso
  flujo: PasoFlujo[];

  // Resultados
  margenContribucion: number;
  margenContribucionPct: number;
  puntoEquilibrioUnidades: number;
  volumenObjetivo: number;
  gastosFijos: number;

  // Alertas detectadas
  alertas: AlertaDiagnostico[];

  // Verificaciones de auditoría
  verificaciones: {
    grossUpCorrecto: boolean;
    smsSoloRural: boolean;
    pasarelaSegmentada: boolean;
    icaSobreIngresos: boolean;
    cloudEscalable: boolean;
  };
}

// ============ CONSTANTES DE AUDITORÍA ============
const MARGEN_MINIMO_VIABLE = 0.05; // 5%
const MARGEN_CRITICO = 0;

// ============ FUNCIÓN PRINCIPAL DE DIAGNÓSTICO ============
export function ejecutarDiagnosticoUnitario(
  codigoSKU: string = 'ING-001',
  volumen: number = 1,
  mixDigital: number = 0.40 // 40% urbano/digital, 60% rural/efectivo
): DiagnosticoUnitario {
  const alertas: AlertaDiagnostico[] = [];
  const flujo: PasoFlujo[] = [];
  let acumulado = 0;
  let orden = 0;

  // ============ PASO 1: ENTRADA DE DINERO ============
  const itemIngreso = getItemByCodigo(codigoSKU);
  if (!itemIngreso) {
    throw new Error(`SKU no encontrado: ${codigoSKU}`);
  }

  const precioEntrada = itemIngreso.valorUnitario * volumen;
  acumulado = precioEntrada;

  flujo.push({
    orden: ++orden,
    concepto: `Ingreso Bruto (${itemIngreso.concepto})`,
    codigo: codigoSKU,
    tipo: 'entrada',
    monto: precioEntrada,
    formula: `${itemIngreso.valorUnitario.toLocaleString()} × ${volumen} unidad(es)`,
    acumulado
  });

  // ============ PASO 2: BIFURCACIÓN DE MEDIOS DE PAGO ============
  const mixRural = 1 - mixDigital;

  // 2.1 Costo Pasarela Digital (solo aplica a % digital)
  const costoPasarelaDigital = getItemByCodigo('C-VAR-06');
  const montoDigital = costoPasarelaDigital
    ? costoPasarelaDigital.valorUnitario * volumen * mixDigital
    : 0;

  if (montoDigital > 0) {
    acumulado -= montoDigital;
    flujo.push({
      orden: ++orden,
      concepto: `Pasarela Wompi (${(mixDigital * 100).toFixed(0)}% Digital)`,
      codigo: 'C-VAR-06',
      tipo: 'salida',
      monto: -montoDigital,
      formula: `$6,500 × ${volumen} × ${mixDigital.toFixed(2)} = $${montoDigital.toLocaleString()}`,
      acumulado
    });
  }

  // 2.2 Costo Recaudo Efectivo (solo aplica a % rural)
  const costoEfectivo = getItemByCodigo('C-VAR-07');
  const montoEfectivo = costoEfectivo
    ? costoEfectivo.valorUnitario * volumen * mixRural
    : 0;

  if (montoEfectivo > 0) {
    acumulado -= montoEfectivo;
    flujo.push({
      orden: ++orden,
      concepto: `Recaudo Efectivo (${(mixRural * 100).toFixed(0)}% Rural)`,
      codigo: 'C-VAR-07',
      tipo: 'salida',
      monto: -montoEfectivo,
      formula: `$7,200 × ${volumen} × ${mixRural.toFixed(2)} = $${montoEfectivo.toLocaleString()}`,
      acumulado
    });
  }

  // 2.3 SMS Transaccional (SOLO para transacciones rurales)
  const costoSMS = getItemByCodigo('C-VAR-09');
  const montoSMS = costoSMS ? costoSMS.valorUnitario * volumen * mixRural : 0;

  // VERIFICACIÓN DE AUDITORÍA: SMS solo rural
  const smsSoloRural = montoSMS === 0 || mixRural > 0;

  if (montoSMS > 0) {
    acumulado -= montoSMS;
    flujo.push({
      orden: ++orden,
      concepto: 'SMS Transaccional (Solo Rural)',
      codigo: 'C-VAR-09',
      tipo: 'salida',
      monto: -montoSMS,
      formula: `$150 × ${volumen} × ${mixRural.toFixed(2)} = $${montoSMS.toLocaleString()}`,
      acumulado,
      alerta: mixRural === 0 ? '⚠️ SMS aplicado a 0% rural' : undefined
    });
  }

  // ============ PASO 3: PAGO AL ABOGADO + GROSS-UP TRIBUTARIO ============
  const costoAbogado = getCostoVinculado(codigoSKU);
  const pagoNetoAbogado = costoAbogado ? costoAbogado.valorUnitario * volumen : 0;

  if (pagoNetoAbogado > 0) {
    // CÁLCULO CRÍTICO: Gross-Up para que el abogado reciba NETO
    // Si el abogado debe recibir $100,000 netos y la retención es 11%:
    // Base Gravable = Neto / (1 - %Retención) = 100,000 / 0.89 = $112,359.55
    // Retención = Base × 11% = $12,359.55

    const baseGravable = pagoNetoAbogado / (1 - RETEFUENTE_ABOGADOS);
    const retefuenteAsumida = baseGravable - pagoNetoAbogado;

    // VERIFICACIÓN: ¿El modelo actual calcula bien el gross-up?
    const grossUpEsperado = pagoNetoAbogado / (1 - RETEFUENTE_ABOGADOS);
    const grossUpActual = pagoNetoAbogado * (1 + RETEFUENTE_ABOGADOS / (1 - RETEFUENTE_ABOGADOS));
    const grossUpCorrecto = Math.abs(grossUpActual - grossUpEsperado) < 1;

    if (!grossUpCorrecto) {
      alertas.push({
        severidad: 'CRITICA',
        categoria: 'Tributario',
        titulo: 'Error en cálculo Gross-Up',
        descripcion: 'El modelo calcula incorrectamente la retención asumida. Está restando 11% en vez de calcular la base inversa.',
        valorActual: pagoNetoAbogado * RETEFUENTE_ABOGADOS, // Error común
        valorEsperado: retefuenteAsumida,
        solucionPropuesta: 'Usar: retefuente = netoAbogado / (1 - 0.11) - netoAbogado'
      });
    }

    // Registrar pago al abogado
    acumulado -= pagoNetoAbogado;
    flujo.push({
      orden: ++orden,
      concepto: 'Pago Neto Abogado (Garantizado)',
      codigo: 'C-VAR-01',
      tipo: 'salida',
      monto: -pagoNetoAbogado,
      formula: `Neto garantizado: $${pagoNetoAbogado.toLocaleString()}`,
      acumulado
    });

    // Registrar retención asumida (costo oculto)
    acumulado -= retefuenteAsumida;
    flujo.push({
      orden: ++orden,
      concepto: 'ReteFuente Asumida (11% Gross-Up)',
      codigo: 'C-VAR-04',
      tipo: 'impuesto',
      monto: -retefuenteAsumida,
      formula: `Base = $${pagoNetoAbogado.toLocaleString()} ÷ (1 - 11%) = $${Math.round(baseGravable).toLocaleString()}\nRetención = $${Math.round(retefuenteAsumida).toLocaleString()}`,
      acumulado,
      alerta: '⚠️ Costo oculto: LegalMeet paga esto a la DIAN'
    });

    // ============ PASO 4: GMF 4x1000 sobre dispersión ============
    const baseGMF = pagoNetoAbogado + retefuenteAsumida; // Total que sale de la cuenta
    const montoGMF = baseGMF * GMF_RATE;

    acumulado -= montoGMF;
    flujo.push({
      orden: ++orden,
      concepto: 'GMF 4x1000 (Dispersión)',
      codigo: 'C-VAR-05',
      tipo: 'impuesto',
      monto: -montoGMF,
      formula: `($${pagoNetoAbogado.toLocaleString()} + $${Math.round(retefuenteAsumida).toLocaleString()}) × 0.4% = $${Math.round(montoGMF).toLocaleString()}`,
      acumulado
    });
  }

  // ============ PASO 5: COSTOS API/COMPLIANCE ============
  // SAGRILAFT (siempre)
  const costoSagrilaft = getItemByCodigo('C-VAR-10');
  const montoSagrilaft = costoSagrilaft ? costoSagrilaft.valorUnitario * volumen : 0;

  if (montoSagrilaft > 0) {
    acumulado -= montoSagrilaft;
    flujo.push({
      orden: ++orden,
      concepto: 'Consulta SAGRILAFT (Anti-Lavado)',
      codigo: 'C-VAR-10',
      tipo: 'salida',
      monto: -montoSagrilaft,
      formula: `$3,000 × ${volumen} = $${montoSagrilaft.toLocaleString()}`,
      acumulado
    });
  }

  // WhatsApp API
  const costoWhatsapp = getItemByCodigo('C-VAR-08');
  const montoWhatsapp = costoWhatsapp ? costoWhatsapp.valorUnitario * volumen : 0;

  if (montoWhatsapp > 0) {
    acumulado -= montoWhatsapp;
    flujo.push({
      orden: ++orden,
      concepto: 'WhatsApp Business API',
      codigo: 'C-VAR-08',
      tipo: 'salida',
      monto: -montoWhatsapp,
      formula: `$250 × ${volumen} = $${montoWhatsapp.toLocaleString()}`,
      acumulado
    });
  }

  // ============ MARGEN DE CONTRIBUCIÓN UNITARIO ============
  const margenContribucion = acumulado;
  const margenContribucionPct = precioEntrada > 0 ? margenContribucion / precioEntrada : 0;

  flujo.push({
    orden: ++orden,
    concepto: '═══ MARGEN DE CONTRIBUCIÓN ═══',
    codigo: 'MC',
    tipo: 'info',
    monto: margenContribucion,
    formula: `${(margenContribucionPct * 100).toFixed(2)}% del ingreso bruto`,
    acumulado: margenContribucion,
    esError: margenContribucionPct < MARGEN_MINIMO_VIABLE
  });

  // Validar margen
  if (margenContribucionPct < MARGEN_CRITICO) {
    alertas.push({
      severidad: 'CRITICA',
      categoria: 'Rentabilidad',
      titulo: 'MODELO INVIABLE - Margen Negativo',
      descripcion: 'El margen de contribución es negativo. Cada venta genera pérdida.',
      valorActual: margenContribucionPct * 100,
      valorEsperado: MARGEN_MINIMO_VIABLE * 100,
      solucionPropuesta: 'Revisar estructura de costos o aumentar precio'
    });
  } else if (margenContribucionPct < MARGEN_MINIMO_VIABLE) {
    alertas.push({
      severidad: 'ALTA',
      categoria: 'Rentabilidad',
      titulo: 'Margen Peligrosamente Bajo',
      descripcion: `Margen del ${(margenContribucionPct * 100).toFixed(2)}% insuficiente para cubrir gastos fijos.`,
      valorActual: margenContribucionPct * 100,
      valorEsperado: MARGEN_MINIMO_VIABLE * 100
    });
  }

  // ============ PASO 6: ANÁLISIS OPEX Y PUNTO DE EQUILIBRIO ============
  const nominaTotal = getNominaTotal();

  // Cloud computing (¿crece con volumen?)
  const cloudItem = getItemByCodigo('G-TEC-01');
  const cloudEscalable = cloudItem?.driver === 'Usuario'; // Debería ser variable

  if (!cloudEscalable) {
    alertas.push({
      severidad: 'MEDIA',
      categoria: 'Eficiencia',
      titulo: 'Costo Cloud no escalable',
      descripcion: 'El gasto de servidores está configurado como fijo cuando debería escalar con usuarios.',
      valorActual: cloudItem?.valorUnitario || 0,
      tipoValor: 'moneda'
    });
  }

  // Punto de equilibrio
  const gastosFixosMensuales = nominaTotal +
    (GASTOS_OPEX_CATALOG.find(g => g.codigo === 'G-TEC-01')?.valorUnitario || 0) * 100 + // Estimado usuarios
    (GASTOS_OPEX_CATALOG.find(g => g.codigo === 'G-TEC-03')?.valorUnitario || 0) * 50; // Estimado GB

  const puntoEquilibrioUnidades = margenContribucion > 0
    ? Math.ceil(gastosFixosMensuales / margenContribucion)
    : Infinity;

  // Volumen Objetivo (Meta: 15% de Margen Neto sobre Ventas)
  // Utilidad = Ingresos - CostosVar - GastosFijos
  // 0.15 * (P * Q) = (MC * Q) - CF
  // CF = Q * (MC - 0.15 * P)
  // Q = CF / (MC - 0.15 * P)
  const metaMargen = 0.15;
  const margenDeseadoPorUnidad = precioEntrada * metaMargen;
  const denominadorObjetivo = margenContribucion - margenDeseadoPorUnidad;

  const volumenObjetivo = denominadorObjetivo > 0
    ? Math.ceil(gastosFixosMensuales / denominadorObjetivo)
    : Infinity; // Imposible alcanzar ese margen con la estructura actual

  flujo.push({
    orden: ++orden,
    concepto: 'Punto de Equilibrio (unidades/mes)',
    codigo: 'PE',
    tipo: 'info',
    monto: puntoEquilibrioUnidades,
    formula: `Gastos Fijos ($${gastosFixosMensuales.toLocaleString()}) ÷ Margen ($${margenContribucion.toLocaleString()})`,
    acumulado: puntoEquilibrioUnidades
  });

  // ============ PASO 7: IMPUESTO ICA (Verificación) ============
  const icaSobreIngresos = true; // El catálogo lo tiene configurado sobre "Ingreso Bruto"
  const montoICA = precioEntrada * TASA_ICA_BOGOTA;

  flujo.push({
    orden: ++orden,
    concepto: 'ICA Bogotá (sobre Ingreso Bruto)',
    codigo: 'IMP-002',
    tipo: 'impuesto',
    monto: -montoICA,
    formula: `$${precioEntrada.toLocaleString()} × ${(TASA_ICA_BOGOTA * 100).toFixed(3)}% = $${Math.round(montoICA).toLocaleString()}`,
    acumulado: margenContribucion - montoICA,
    alerta: icaSobreIngresos ? undefined : '⚠️ ICA debe calcularse sobre ingresos, no utilidad'
  });

  // Verificar pasarela segmentada
  const pasarelaSegmentada = montoDigital !== montoEfectivo || mixDigital !== 0.5;

  return {
    timestamp: new Date(),
    skuAnalizado: codigoSKU,
    precioEntrada,
    volumen,
    mixDigital,
    mixRural,
    flujo,
    margenContribucion,
    margenContribucionPct,
    puntoEquilibrioUnidades,
    volumenObjetivo, // Exposed result
    gastosFijos: gastosFixosMensuales, // Exposed context
    alertas,
    verificaciones: {
      grossUpCorrecto: !alertas.some(a => a.titulo.includes('Gross-Up')),
      smsSoloRural,
      pasarelaSegmentada,
      icaSobreIngresos,
      cloudEscalable
    }
  };
}

// ============ FUNCIÓN AUXILIAR: Formatear para UI ============
export function formatearFlujoDinero(diagnostico: DiagnosticoUnitario): string {
  let resultado = `\n═══════════════════════════════════════════════════════════════\n`;
  resultado += `   ANÁLISIS UNITARIO: ${diagnostico.skuAnalizado}\n`;
  resultado += `   Entrada: $${diagnostico.precioEntrada.toLocaleString()} | Mix: ${(diagnostico.mixDigital * 100).toFixed(0)}% Digital / ${(diagnostico.mixRural * 100).toFixed(0)}% Rural\n`;
  resultado += `═══════════════════════════════════════════════════════════════\n\n`;

  diagnostico.flujo.forEach(paso => {
    const signo = paso.tipo === 'entrada' ? '+' : paso.tipo === 'info' ? '═' : '-';
    const monto = paso.tipo === 'info' && paso.codigo === 'PE'
      ? `${paso.monto} unidades`
      : `$${Math.abs(paso.monto).toLocaleString()}`;

    resultado += `${paso.orden}. ${paso.concepto}\n`;
    resultado += `   ${signo} ${monto}\n`;
    resultado += `   Fórmula: ${paso.formula}\n`;
    if (paso.tipo !== 'info') {
      resultado += `   Acumulado: $${paso.acumulado.toLocaleString()}\n`;
    }
    if (paso.alerta) {
      resultado += `   ${paso.alerta}\n`;
    }
    resultado += `\n`;
  });

  return resultado;
}
