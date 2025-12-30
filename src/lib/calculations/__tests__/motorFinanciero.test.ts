import { describe, it, expect } from 'vitest';
import { 
  calcularProyeccionMensual,
  calcularProyeccionAnual,
  calcularUnitEconomicsPorSKU,
  calcularPrecioIndexado,
  getDiasHabiles,
  generarERI,
  generarFlujoCajaMensual
} from '../motorFinanciero';
import { PARAMETROS_MACRO_DEFAULT } from '@/store/simuladorStore';
import { INGRESOS_CATALOG } from '@/lib/constants/catalogoMaestro';
import { ConfiguracionModelo } from '@/types/catalogo';

const defaultConfig: ConfiguracionModelo = {
  añoInicio: 2026,
  añoFin: 2031,
  capitalInicial: 500000000,
  metaGrowthAnual: 0.30,
  mixPagoDigital: 0.70,
  tasaChurnMensual: 0.05,
  diasCartera: 5,
  diasProveedores: 30
};

describe('calcularPrecioIndexado', () => {
  it('mantiene precio si año base = año actual', () => {
    const precio = calcularPrecioIndexado(100000, 2026, 2026, PARAMETROS_MACRO_DEFAULT);
    expect(precio).toBe(100000);
  });

  it('incrementa precio por inflación', () => {
    const precio = calcularPrecioIndexado(100000, 2026, 2027, PARAMETROS_MACRO_DEFAULT);
    expect(precio).toBeGreaterThan(100000);
  });

  it('aplica inflación compuesta para múltiples años', () => {
    const precio1Año = calcularPrecioIndexado(100000, 2026, 2027, PARAMETROS_MACRO_DEFAULT);
    const precio2Años = calcularPrecioIndexado(100000, 2026, 2028, PARAMETROS_MACRO_DEFAULT);
    
    expect(precio2Años).toBeGreaterThan(precio1Año);
  });

  it('redondea resultado a entero', () => {
    const precio = calcularPrecioIndexado(100001, 2026, 2027, PARAMETROS_MACRO_DEFAULT);
    expect(Number.isInteger(precio)).toBe(true);
  });
});

describe('getDiasHabiles', () => {
  it('retorna días hábiles para enero 2026', () => {
    const dias = getDiasHabiles(2026, 1);
    expect(dias).toBeGreaterThan(15);
    expect(dias).toBeLessThan(25);
  });

  it('retorna días para todos los meses', () => {
    for (let mes = 1; mes <= 12; mes++) {
      const dias = getDiasHabiles(2026, mes);
      expect(dias).toBeGreaterThan(0);
    }
  });
});

describe('calcularUnitEconomicsPorSKU', () => {
  const mockIngreso = INGRESOS_CATALOG[0];
  
  if (mockIngreso) {
    it('calcula ingreso total = precio × volumen', () => {
      const result = calcularUnitEconomicsPorSKU(
        mockIngreso,
        100,
        2026,
        PARAMETROS_MACRO_DEFAULT,
        0.7
      );
      
      expect(result.ingresoTotal).toBe(mockIngreso.valorUnitario * 100);
    });

    it('calcula margen de contribución positivo para volumen normal', () => {
      const result = calcularUnitEconomicsPorSKU(
        mockIngreso,
        100,
        2026,
        PARAMETROS_MACRO_DEFAULT,
        0.7
      );
      
      expect(result.margenContribucion).toBeGreaterThan(0);
    });

    it('calcula costos de pasarela según mix digital', () => {
      const resultDigital = calcularUnitEconomicsPorSKU(
        mockIngreso,
        100,
        2026,
        PARAMETROS_MACRO_DEFAULT,
        1.0 // 100% digital
      );
      
      const resultEfectivo = calcularUnitEconomicsPorSKU(
        mockIngreso,
        100,
        2026,
        PARAMETROS_MACRO_DEFAULT,
        0.0 // 100% efectivo
      );
      
      // Efectivo es más caro en pasarela
      expect(resultEfectivo.pasarela).toBeGreaterThan(resultDigital.pasarela);
    });

    it('incluye SMS solo para transacciones en efectivo', () => {
      const resultDigital = calcularUnitEconomicsPorSKU(
        mockIngreso,
        100,
        2026,
        PARAMETROS_MACRO_DEFAULT,
        1.0
      );
      
      expect(resultDigital.sms).toBe(0);
      
      const resultEfectivo = calcularUnitEconomicsPorSKU(
        mockIngreso,
        100,
        2026,
        PARAMETROS_MACRO_DEFAULT,
        0.0
      );
      
      expect(resultEfectivo.sms).toBeGreaterThan(0);
    });

    it('maneja volumen 0', () => {
      const result = calcularUnitEconomicsPorSKU(
        mockIngreso,
        0,
        2026,
        PARAMETROS_MACRO_DEFAULT,
        0.7
      );
      
      expect(result.ingresoTotal).toBe(0);
      expect(result.costoTotal).toBe(0);
    });
  }
});

describe('calcularProyeccionMensual', () => {
  const volumenes = { 'ING-TRANS-01': 100 };
  
  it('calcula proyección mensual completa', () => {
    const proyeccion = calcularProyeccionMensual(
      2026,
      1,
      volumenes,
      defaultConfig,
      PARAMETROS_MACRO_DEFAULT
    );
    
    expect(proyeccion.año).toBe(2026);
    expect(proyeccion.mes).toBe(1);
    expect(proyeccion.periodo).toBe('2026-01');
  });

  it('calcula ingresos brutos > 0 con volumen', () => {
    const proyeccion = calcularProyeccionMensual(
      2026,
      1,
      volumenes,
      defaultConfig,
      PARAMETROS_MACRO_DEFAULT
    );
    
    expect(proyeccion.ingresosBrutos).toBeGreaterThan(0);
  });

  it('calcula ICA Bogotá sobre ingresos brutos', () => {
    const proyeccion = calcularProyeccionMensual(
      2026,
      1,
      volumenes,
      defaultConfig,
      PARAMETROS_MACRO_DEFAULT
    );
    
    // ICA = ingresos × 0.00966
    const icaEsperado = proyeccion.ingresosBrutos * 0.00966;
    expect(proyeccion.icaBogota).toBeCloseTo(icaEsperado, -2);
  });

  it('retorna valores redondeados a enteros', () => {
    const proyeccion = calcularProyeccionMensual(
      2026,
      1,
      volumenes,
      defaultConfig,
      PARAMETROS_MACRO_DEFAULT
    );
    
    expect(Number.isInteger(proyeccion.ingresosBrutos)).toBe(true);
    expect(Number.isInteger(proyeccion.utilidadNeta)).toBe(true);
  });

  it('maneja volúmenes vacíos', () => {
    const proyeccion = calcularProyeccionMensual(
      2026,
      1,
      {},
      defaultConfig,
      PARAMETROS_MACRO_DEFAULT
    );
    
    expect(proyeccion.ingresosBrutos).toBe(0);
  });
});

describe('calcularProyeccionAnual', () => {
  const volumenesMensuales: Record<string, Record<number, number>> = {
    'ING-TRANS-01': { 1: 100, 2: 110, 3: 120, 4: 130, 5: 140, 6: 150, 7: 160, 8: 170, 9: 180, 10: 190, 11: 200, 12: 210 }
  };

  it('genera 12 meses de proyección', () => {
    const proyeccion = calcularProyeccionAnual(
      2026,
      volumenesMensuales,
      defaultConfig,
      PARAMETROS_MACRO_DEFAULT
    );
    
    expect(proyeccion.meses).toHaveLength(12);
  });

  it('calcula totales anuales', () => {
    const proyeccion = calcularProyeccionAnual(
      2026,
      volumenesMensuales,
      defaultConfig,
      PARAMETROS_MACRO_DEFAULT
    );
    
    expect(proyeccion.totales.ingresosBrutos).toBeGreaterThan(0);
    expect(proyeccion.totales.utilidadNeta).toBeDefined();
  });

  it('totales son suma de meses', () => {
    const proyeccion = calcularProyeccionAnual(
      2026,
      volumenesMensuales,
      defaultConfig,
      PARAMETROS_MACRO_DEFAULT
    );
    
    const sumaIngresos = proyeccion.meses.reduce((sum, m) => sum + m.ingresosBrutos, 0);
    expect(proyeccion.totales.ingresosBrutos).toBe(sumaIngresos);
  });
});

describe('generarERI', () => {
  it('genera Estado de Resultados Integral', () => {
    const volumenesMensuales = {
      'ING-TRANS-01': { 1: 100, 2: 100, 3: 100, 4: 100, 5: 100, 6: 100, 7: 100, 8: 100, 9: 100, 10: 100, 11: 100, 12: 100 }
    };
    
    const proyeccion = calcularProyeccionAnual(
      2026,
      volumenesMensuales,
      defaultConfig,
      PARAMETROS_MACRO_DEFAULT
    );
    
    const eri = generarERI(proyeccion);
    
    expect(eri.periodo).toBe('2026');
    expect(eri.añoFiscal).toBe(2026);
    expect(eri.ingresosOrdinarios.total).toBe(proyeccion.totales.ingresosBrutos);
  });

  it('desglosa ingresos por tipo', () => {
    const volumenesMensuales = {
      'ING-TRANS-01': { 1: 100, 2: 100, 3: 100, 4: 100, 5: 100, 6: 100, 7: 100, 8: 100, 9: 100, 10: 100, 11: 100, 12: 100 }
    };
    
    const proyeccion = calcularProyeccionAnual(
      2026,
      volumenesMensuales,
      defaultConfig,
      PARAMETROS_MACRO_DEFAULT
    );
    
    const eri = generarERI(proyeccion);
    
    const sumaIngresos = 
      eri.ingresosOrdinarios.serviciosLegales +
      eri.ingresosOrdinarios.suscripciones +
      eri.ingresosOrdinarios.productosDigitales +
      eri.ingresosOrdinarios.otros;
    
    expect(sumaIngresos).toBe(eri.ingresosOrdinarios.total);
  });
});

describe('generarFlujoCajaMensual', () => {
  it('genera flujo de caja con saldo inicial', () => {
    const volumenes = { 'ING-TRANS-01': 100 };
    const proyeccion = calcularProyeccionMensual(
      2026,
      1,
      volumenes,
      defaultConfig,
      PARAMETROS_MACRO_DEFAULT
    );
    
    const flujo = generarFlujoCajaMensual(proyeccion, 500000000, defaultConfig);
    
    expect(flujo.saldoInicial).toBe(500000000);
    expect(flujo.periodo).toBe('2026-01');
  });

  it('calcula saldo final = saldo inicial + flujo neto', () => {
    const volumenes = { 'ING-TRANS-01': 100 };
    const proyeccion = calcularProyeccionMensual(
      2026,
      1,
      volumenes,
      defaultConfig,
      PARAMETROS_MACRO_DEFAULT
    );
    
    const flujo = generarFlujoCajaMensual(proyeccion, 500000000, defaultConfig);
    
    expect(flujo.saldoFinal).toBe(flujo.saldoInicial + flujo.flujoNeto);
  });

  it('separa recaudo por canal según mix digital', () => {
    const volumenes = { 'ING-TRANS-01': 100 };
    const proyeccion = calcularProyeccionMensual(
      2026,
      1,
      volumenes,
      defaultConfig,
      PARAMETROS_MACRO_DEFAULT
    );
    
    const flujo = generarFlujoCajaMensual(proyeccion, 500000000, defaultConfig);
    
    // Con 70% digital
    expect(flujo.recaudoPasarela).toBeGreaterThan(flujo.recaudoEfectivo);
  });
});
