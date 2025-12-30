import { useMemo, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { calcularProyeccionAnual } from '@/lib/calculations/motorFinanciero';
import { 
  generarThreeStatementModel,
  calcularCashConversion 
} from '@/lib/calculations/threeStatements';
import { ThreeStatementModel, CashConversionCycle } from '@/types/threeStatements';

export function useFinancialStatements() {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  
  const {
    config,
    volumenes,
    parametrosMacro,
    catalogoIngresos,
    simulacionActiva,
  } = useSimuladorStore();

  // Generate projections for all years
  const proyecciones = useMemo(() => {
    const result: Record<number, ReturnType<typeof calcularProyeccionAnual>> = {};
    const catalogoEfectivo = catalogoIngresos.length > 0 ? catalogoIngresos : undefined;
    
    for (let año = config.añoInicio; año <= config.añoFin; año++) {
      const volAño = volumenes[año] || {};
      result[año] = calcularProyeccionAnual(año, volAño, config, parametrosMacro, catalogoEfectivo);
    }
    
    return result;
  }, [config, volumenes, parametrosMacro, catalogoIngresos]);

  // Generate Three-Statement models for all years
  const threeStatements = useMemo(() => {
    const models: Record<number, ThreeStatementModel> = {};
    let efectivoAcumulado = config.capitalInicial;
    let ppeAcumulado = 0;
    let softwareAcumulado = 0;
    let depreciacionAcumulada = 0;
    let amortizacionAcumulada = 0;
    let cxcAnterior = 0;
    let cxpAnterior = 0;
    let impuestosAnterior = 0;
    let escrowAnterior = 0;
    let utilidadesRetenidas = 0;

    for (let año = config.añoInicio; año <= config.añoFin; año++) {
      const proy = proyecciones[año];
      if (!proy) continue;

      const capex = proy.totales.totalOPEX * 0.05;
      const inversionSoftware = proy.totales.totalOPEX * 0.02;
      const depreciacion = ppeAcumulado * 0.1;
      const amortizacion = softwareAcumulado * 0.2;
      const escrowAbogados = proy.totales.ingresosBrutos * 0.4 / 12;

      const model = generarThreeStatementModel({
        año,
        ingresosBrutos: proy.totales.ingresosBrutos,
        costoVentas: proy.totales.totalCostosDirectos,
        gastosOperativos: proy.totales.totalOPEX,
        depreciacion,
        amortizacion,
        gastosFinancieros: 0,
        impuestoRenta: Math.max(0, proy.totales.ebitda * 0.35),
        efectivoInicial: efectivoAcumulado,
        capitalSocial: config.capitalInicial,
        reservaLegal: 0,
        utilidadesRetenidas,
        diasCartera: config.diasCartera,
        diasProveedores: config.diasProveedores,
        escrowAbogados,
        capex,
        inversionSoftware,
        ppeAcumulado,
        softwareAcumulado,
        depreciacionAcumulada,
        amortizacionAcumulada,
        cxcAnterior,
        cxpAnterior,
        impuestosAnterior,
        escrowAnterior,
      });

      models[año] = model;

      // Update cumulative values for next year
      efectivoAcumulado = model.balanceGeneral.activos.corrientes.efectivo;
      ppeAcumulado = model.balanceGeneral.activos.noCorrientes.propiedadPlantaEquipo;
      softwareAcumulado = model.balanceGeneral.activos.noCorrientes.softwareDesarrollo;
      depreciacionAcumulada = model.balanceGeneral.activos.noCorrientes.depreciacionAcumulada;
      amortizacionAcumulada = model.balanceGeneral.activos.noCorrientes.amortizacionAcumulada;
      cxcAnterior = model.balanceGeneral.activos.corrientes.cuentasPorCobrar;
      cxpAnterior = model.balanceGeneral.pasivos.corrientes.cuentasPorPagar;
      impuestosAnterior = model.balanceGeneral.pasivos.corrientes.impuestosPorPagar;
      escrowAnterior = escrowAbogados;
      utilidadesRetenidas += model.estadoResultados.utilidadNeta;
    }

    return models;
  }, [proyecciones, config]);

  // Cash Conversion Cycle for selected year
  const cashConversion = useMemo((): CashConversionCycle | null => {
    const model = threeStatements[selectedYear];
    if (!model) return null;
    
    const ventas30Dias = model.estadoResultados.ingresosBrutos / 12;
    const costos30Dias = model.estadoResultados.costoVentas / 12;
    
    return calcularCashConversion(
      ventas30Dias,
      model.balanceGeneral.activos.corrientes.cuentasPorCobrar,
      model.balanceGeneral.pasivos.corrientes.cuentasPorPagar,
      costos30Dias
    );
  }, [threeStatements, selectedYear]);

  const currentModel = threeStatements[selectedYear];

  const availableYears = Object.keys(threeStatements).map(Number);

  return {
    selectedYear,
    setSelectedYear,
    simulacionActiva,
    threeStatements,
    currentModel,
    cashConversion,
    availableYears,
  };
}
