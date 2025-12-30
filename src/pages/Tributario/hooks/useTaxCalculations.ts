import { useMemo } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { IMPUESTOS, PASARELA, OPERACIONES } from '@/lib/constants/financialConstants';

// ============ INTERFACES ============

export interface TaxProjectionRow {
  mes: number;
  año: number;
  ingresosBrutos: number;
  baseGravableICA: number;
  ica: number;
  retefuenteAsumida: number;
  gmf: number;
  rentaProvision: number;
  totalImpuestos: number;
  tasaEfectiva: number;
}

export interface TaxTotals {
  totalICA: number;
  totalRetefuente: number;
  totalGMF: number;
  totalRenta: number;
  totalImpuestos: number;
  tasaEfectivaPromedio: number;
  ingresosTotales: number;
  utilidadBruta: number;
}

export interface ContribucionLaboral {
  concepto: string;
  porcentaje: number;
  baseCalculo: string;
  valorAnual: number;
}

export interface ObligacionTributaria {
  impuesto: string;
  baseGravable: number;
  tasa: number;
  valorAnual: number;
  periodicidad: string;
}

export interface CostoTransaccional {
  concepto: string;
  baseCalculo: number;
  tasa: number;
  valorAnual: number;
}

export interface TaxScenario {
  nombre: string;
  descripcion: string;
  totalImpuestos: number;
  diferencia: number;
  porcentajeDiferencia: number;
}

export interface DatosProyectados {
  año: number;
  ingresosBrutos: number;
  costoVentas: number;
  utilidadBruta: number;
  gastosOperativos: number;
  utilidadOperacional: number;
  impuestoRenta: number;
  ica: number;
  gmf: number;
  totalImpuestos: number;
  tasaEfectiva: number;
}

// Constantes de prestaciones laborales Colombia
const PRESTACIONES_LABORALES = {
  SALUD_EMPLEADOR: 0.085,
  PENSION_EMPLEADOR: 0.12,
  ARL_RIESGO_1: 0.00522,
  CAJA_COMPENSACION: 0.04,
  ICBF: 0.03,
  SENA: 0.02,
  CESANTIAS: 0.0833,
  INTERESES_CESANTIAS: 0.12,
  PRIMA: 0.0833,
  VACACIONES: 0.0417,
} as const;

// ============ HOOK PRINCIPAL ============

export function useTaxCalculations() {
  const config = useSimuladorStore((state) => state.config);
  const volumenes = useSimuladorStore((state) => state.volumenes);
  const catalogoIngresos = useSimuladorStore((state) => state.catalogoIngresos);
  const catalogoCostos = useSimuladorStore((state) => state.catalogoCostos);
  const catalogoOPEX = useSimuladorStore((state) => state.catalogoOPEX);
  const catalogoImpuestos = useSimuladorStore((state) => state.catalogoImpuestos);

  const catalogo = useMemo(() => [
    ...catalogoIngresos,
    ...catalogoCostos,
    ...catalogoOPEX,
    ...catalogoImpuestos
  ], [catalogoIngresos, catalogoCostos, catalogoOPEX, catalogoImpuestos]);
  const parametrosMacro = useSimuladorStore((state) => state.parametrosMacro);
  const simulacionActiva = useSimuladorStore((state) => state.simulacionActiva);

  // Filtrar parámetros macro válidos
  const parametrosFiltrados = useMemo(() => {
    return parametrosMacro
      .filter(p => p.año >= config.añoInicio && p.año <= config.añoFin)
      .sort((a, b) => a.año - b.año);
  }, [parametrosMacro, config.añoInicio, config.añoFin]);

  // Calcular proyecciones anuales desde el catálogo y volúmenes
  const proyeccionesAnuales = useMemo(() => {
    if (!simulacionActiva) return [];

    const años: number[] = [];
    for (let año = config.añoInicio; año <= config.añoFin; año++) {
      años.push(año);
    }

    return años.map(año => {
      const volAño = volumenes[año] || {};
      let ingresosBrutos = 0;
      let costoDirecto = 0;

      // Calcular ingresos y costos por SKU
      catalogo.filter(item => item.tipo === 'ingreso').forEach(item => {
        const volSku = volAño[item.codigo] || {};
        const volumenAnual = Object.values(volSku).reduce((sum: number, v) => sum + (v as number), 0);
        ingresosBrutos += volumenAnual * item.valorUnitario;
      });

      catalogo.filter(item => item.tipo === 'costo_variable').forEach(item => {
        costoDirecto += item.valorUnitario * OPERACIONES.MESES_POR_AÑO;
      });

      const utilidadBruta = ingresosBrutos - costoDirecto;
      const gastosOperativos = catalogo
        .filter(item => item.tipo === 'gasto')
        .reduce((sum, item) => sum + (item.valorUnitario * OPERACIONES.MESES_POR_AÑO), 0);

      return {
        año,
        ingresosBrutos,
        costoDirecto,
        utilidadBruta,
        gastosOperativos,
        utilidadOperacional: utilidadBruta - gastosOperativos,
      };
    });
  }, [simulacionActiva, config, catalogo, volumenes]);

  // Agregar datos proyectados con impuestos
  const datosProyectados = useMemo((): DatosProyectados[] => {
    return proyeccionesAnuales.map(proy => {
      const ingresosBrutos = proy.ingresosBrutos || 0;
      const utilidadOperacional = proy.utilidadOperacional || 0;
      const mixDigital = config.mixPagoDigital || 0.70;

      const impuestoRenta = Math.max(0, utilidadOperacional * IMPUESTOS.TASA_RENTA);
      const ica = ingresosBrutos * IMPUESTOS.ICA_BOGOTA;
      const gmf = (ingresosBrutos * mixDigital) * IMPUESTOS.GMF;
      const totalImpuestos = impuestoRenta + ica + gmf;
      const tasaEfectiva = ingresosBrutos > 0 ? (totalImpuestos / ingresosBrutos) * 100 : 0;

      return {
        año: proy.año,
        ingresosBrutos,
        costoVentas: proy.costoDirecto,
        utilidadBruta: proy.utilidadBruta,
        gastosOperativos: proy.gastosOperativos,
        utilidadOperacional,
        impuestoRenta,
        ica,
        gmf,
        totalImpuestos,
        tasaEfectiva,
      };
    });
  }, [proyeccionesAnuales, config.mixPagoDigital]);

  // Calcular promedios anuales
  const promediosAnuales = useMemo(() => {
    if (datosProyectados.length === 0) {
      return {
        ingresosBrutos: 0,
        utilidadOperacional: 0,
        nominaTotal: 0,
      };
    }

    const totalIngresos = datosProyectados.reduce((sum, d) => sum + d.ingresosBrutos, 0);
    const totalUtilidad = datosProyectados.reduce((sum, d) => sum + d.utilidadOperacional, 0);
    const n = datosProyectados.length;

    // Estimar nómina desde catálogo OPEX
    const nominaMensual = catalogo
      .filter(item => item.esNomina)
      .reduce((sum, item) => sum + item.valorUnitario, 0);

    return {
      ingresosBrutos: totalIngresos / n,
      utilidadOperacional: totalUtilidad / n,
      nominaTotal: nominaMensual * OPERACIONES.MESES_POR_AÑO,
    };
  }, [datosProyectados, catalogo]);

  // Calcular contribuciones laborales
  const contribucionesLaborales = useMemo((): ContribucionLaboral[] => {
    const nominaAnual = promediosAnuales.nominaTotal;

    return [
      {
        concepto: 'Salud (Empleador)',
        porcentaje: PRESTACIONES_LABORALES.SALUD_EMPLEADOR * 100,
        baseCalculo: 'Nómina',
        valorAnual: nominaAnual * PRESTACIONES_LABORALES.SALUD_EMPLEADOR,
      },
      {
        concepto: 'Pensión (Empleador)',
        porcentaje: PRESTACIONES_LABORALES.PENSION_EMPLEADOR * 100,
        baseCalculo: 'Nómina',
        valorAnual: nominaAnual * PRESTACIONES_LABORALES.PENSION_EMPLEADOR,
      },
      {
        concepto: 'ARL',
        porcentaje: PRESTACIONES_LABORALES.ARL_RIESGO_1 * 100,
        baseCalculo: 'Nómina',
        valorAnual: nominaAnual * PRESTACIONES_LABORALES.ARL_RIESGO_1,
      },
      {
        concepto: 'Caja de Compensación',
        porcentaje: PRESTACIONES_LABORALES.CAJA_COMPENSACION * 100,
        baseCalculo: 'Nómina',
        valorAnual: nominaAnual * PRESTACIONES_LABORALES.CAJA_COMPENSACION,
      },
      {
        concepto: 'ICBF',
        porcentaje: PRESTACIONES_LABORALES.ICBF * 100,
        baseCalculo: 'Nómina',
        valorAnual: nominaAnual * PRESTACIONES_LABORALES.ICBF,
      },
      {
        concepto: 'SENA',
        porcentaje: PRESTACIONES_LABORALES.SENA * 100,
        baseCalculo: 'Nómina',
        valorAnual: nominaAnual * PRESTACIONES_LABORALES.SENA,
      },
      {
        concepto: 'Cesantías',
        porcentaje: PRESTACIONES_LABORALES.CESANTIAS * 100,
        baseCalculo: 'Nómina',
        valorAnual: nominaAnual * PRESTACIONES_LABORALES.CESANTIAS,
      },
      {
        concepto: 'Intereses Cesantías',
        porcentaje: PRESTACIONES_LABORALES.INTERESES_CESANTIAS * 100,
        baseCalculo: 'Cesantías',
        valorAnual: nominaAnual * PRESTACIONES_LABORALES.CESANTIAS * PRESTACIONES_LABORALES.INTERESES_CESANTIAS,
      },
      {
        concepto: 'Prima',
        porcentaje: PRESTACIONES_LABORALES.PRIMA * 100,
        baseCalculo: 'Nómina',
        valorAnual: nominaAnual * PRESTACIONES_LABORALES.PRIMA,
      },
      {
        concepto: 'Vacaciones',
        porcentaje: PRESTACIONES_LABORALES.VACACIONES * 100,
        baseCalculo: 'Nómina',
        valorAnual: nominaAnual * PRESTACIONES_LABORALES.VACACIONES,
      },
    ];
  }, [promediosAnuales.nominaTotal]);

  // Calcular obligaciones tributarias
  const obligacionesTributarias = useMemo((): ObligacionTributaria[] => {
    const ingresos = promediosAnuales.ingresosBrutos;
    const utilidad = promediosAnuales.utilidadOperacional;

    return [
      {
        impuesto: 'Impuesto de Renta',
        baseGravable: utilidad,
        tasa: IMPUESTOS.TASA_RENTA * 100,
        valorAnual: Math.max(0, utilidad * IMPUESTOS.TASA_RENTA),
        periodicidad: 'Anual',
      },
      {
        impuesto: 'ICA Bogotá',
        baseGravable: ingresos,
        tasa: IMPUESTOS.ICA_BOGOTA * 100,
        valorAnual: ingresos * IMPUESTOS.ICA_BOGOTA,
        periodicidad: 'Bimestral',
      },
      {
        impuesto: 'Sobretasa Financieras',
        baseGravable: utilidad > 120000 * 42412 ? utilidad : 0,
        tasa: IMPUESTOS.SOBRETASA_FINANCIERAS * 100,
        valorAnual: utilidad > 120000 * 42412 ? utilidad * IMPUESTOS.SOBRETASA_FINANCIERAS : 0,
        periodicidad: 'Anual',
      },
    ];
  }, [promediosAnuales]);

  // Calcular costos transaccionales
  const costosTransaccionales = useMemo((): CostoTransaccional[] => {
    const ingresos = promediosAnuales.ingresosBrutos;
    const mixDigital = config.mixPagoDigital || 0.70;

    return [
      {
        concepto: 'GMF (4x1000)',
        baseCalculo: ingresos * mixDigital,
        tasa: IMPUESTOS.GMF * 100,
        valorAnual: ingresos * mixDigital * IMPUESTOS.GMF,
      },
      {
        concepto: 'Pasarela de Pagos',
        baseCalculo: ingresos * mixDigital,
        tasa: PASARELA.FEE_PCT_DIGITAL * 100,
        valorAnual: ingresos * mixDigital * PASARELA.FEE_PCT_DIGITAL,
      },
    ];
  }, [promediosAnuales.ingresosBrutos, config.mixPagoDigital]);

  // Calcular totales
  const totales = useMemo((): TaxTotals => {
    const totalContribuciones = contribucionesLaborales.reduce((sum, c) => sum + c.valorAnual, 0);
    const totalObligaciones = obligacionesTributarias.reduce((sum, o) => sum + o.valorAnual, 0);
    const totalTransaccionales = costosTransaccionales.reduce((sum, c) => sum + c.valorAnual, 0);

    const totalImpuestos = totalObligaciones + totalTransaccionales;
    const ingresos = promediosAnuales.ingresosBrutos;

    return {
      totalICA: obligacionesTributarias.find(o => o.impuesto === 'ICA Bogotá')?.valorAnual || 0,
      totalRetefuente: 0,
      totalGMF: costosTransaccionales.find(c => c.concepto === 'GMF (4x1000)')?.valorAnual || 0,
      totalRenta: obligacionesTributarias.find(o => o.impuesto === 'Impuesto de Renta')?.valorAnual || 0,
      totalImpuestos: totalImpuestos + totalContribuciones,
      tasaEfectivaPromedio: ingresos > 0 ? ((totalImpuestos + totalContribuciones) / ingresos) * 100 : 0,
      ingresosTotales: ingresos,
      utilidadBruta: promediosAnuales.utilidadOperacional,
    };
  }, [contribucionesLaborales, obligacionesTributarias, costosTransaccionales, promediosAnuales]);

  // Calcular escenarios de comparación
  const escenarios = useMemo((): TaxScenario[] => {
    const baseTotal = totales.totalImpuestos;

    return [
      {
        nombre: 'Escenario Base',
        descripcion: 'Configuración actual',
        totalImpuestos: baseTotal,
        diferencia: 0,
        porcentajeDiferencia: 0,
      },
      {
        nombre: 'Reforma Tributaria 2024',
        descripcion: 'Renta 35% + Sobretasa',
        totalImpuestos: baseTotal * 1.05,
        diferencia: baseTotal * 0.05,
        porcentajeDiferencia: 5,
      },
      {
        nombre: 'Zona Franca',
        descripcion: 'Renta 20%, sin ICA',
        totalImpuestos: baseTotal * 0.7,
        diferencia: -baseTotal * 0.3,
        porcentajeDiferencia: -30,
      },
      {
        nombre: 'ZESE (Zonas Económicas)',
        descripcion: 'Beneficios especiales',
        totalImpuestos: baseTotal * 0.5,
        diferencia: -baseTotal * 0.5,
        porcentajeDiferencia: -50,
      },
    ];
  }, [totales.totalImpuestos]);

  // Desglose para gráficos
  const desglose = useMemo(() => ({
    ica: totales.totalICA,
    retefuente: totales.totalRetefuente,
    gmf: totales.totalGMF,
    renta: totales.totalRenta,
  }), [totales]);

  return {
    datosProyectados,
    proyeccionesAnuales,
    totales,
    escenarios,
    desglose,
    contribucionesLaborales,
    obligacionesTributarias,
    costosTransaccionales,
    parametrosFiltrados,
    promediosAnuales,
    simulacionActiva,
    isCalculating: false,
  };
}
