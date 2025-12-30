import { describe, it, expect } from 'vitest';
import { 
  generarBalanceGeneral, 
  validarTriangulacion,
  calcularCashConversion 
} from '../threeStatements';

describe('generarBalanceGeneral', () => {
  const mockInputs = {
    año: 2026,
    mes: 6,
    utilidadNeta: 50000000,
    depreciacion: 2000000,
    amortizacion: 1000000,
    ingresosBrutos: 200000000,
    costoVentas: 80000000,
    gastosOperativos: 50000000,
    efectivoInicial: 500000000,
    capitalSocial: 200000000,
    reservaLegal: 10000000,
    utilidadesRetenidas: 100000000,
    diasCartera: 30,
    diasProveedores: 45,
    escrowAbogados: 25000000,
    capexPeriodo: 10000000,
    inversionSoftware: 5000000,
    ppeAcumulado: 50000000,
    softwareAcumulado: 20000000,
    depreciacionAcumulada: 10000000,
    amortizacionAcumulada: 5000000,
  };

  it('cumple ecuación patrimonial: Activos = Pasivos + Patrimonio', () => {
    const balance = generarBalanceGeneral(mockInputs);

    const A = balance.activos.totalActivos;
    const P = balance.pasivos.totalPasivos;
    const E = balance.patrimonio.totalPatrimonio;

    // La diferencia debe ser < 1 COP
    expect(Math.abs(A - P - E)).toBeLessThan(1);
    expect(balance.ecuacionPatrimonial.valido).toBe(true);
  });

  it('calcula cuentas por cobrar basado en DSO', () => {
    const balance = generarBalanceGeneral(mockInputs);
    
    // CxC = (Ingresos / 30) * DSO = (200M / 30) * 30 = 200M
    const ventasDiarias = mockInputs.ingresosBrutos / 30;
    const cxcEsperado = ventasDiarias * mockInputs.diasCartera;
    
    expect(balance.activos.corrientes.cuentasPorCobrar).toBeCloseTo(cxcEsperado, -2);
  });

  it('escrow se registra como pasivo corriente', () => {
    const balance = generarBalanceGeneral(mockInputs);
    
    expect(balance.pasivos.corrientes.escrowAbogados).toBe(25000000);
  });

  it('calcula reserva legal del 10%', () => {
    const balance = generarBalanceGeneral(mockInputs);
    
    // Reserva = anterior + (utilidad * 10%)
    const reservaEsperada = mockInputs.reservaLegal + (mockInputs.utilidadNeta * 0.10);
    expect(balance.patrimonio.reservaLegal).toBeCloseTo(reservaEsperada, -2);
  });

  it('calcula activos netos correctamente', () => {
    const balance = generarBalanceGeneral(mockInputs);
    
    // PPE Neto = PPE Bruto - Depreciación Acumulada
    const ppeNetoEsperado = 
      (mockInputs.ppeAcumulado + mockInputs.capexPeriodo) - 
      (mockInputs.depreciacionAcumulada + mockInputs.depreciacion);
    
    expect(balance.activos.noCorrientes.propiedadPlantaEquipoNeto).toBeCloseTo(ppeNetoEsperado, -2);
  });
});

describe('validarTriangulacion', () => {
  it('valida cuando todos los estados concilian', () => {
    const mockBalance = {
      ecuacionPatrimonial: { 
        valido: true, 
        activos: 1000000, 
        pasivos: 400000, 
        patrimonio: 600000,
        diferencia: 0 
      },
      activos: { 
        corrientes: { efectivo: 500000 },
        totalActivos: 1000000 
      },
      pasivos: { 
        corrientes: { escrowAbogados: 100000 },
        totalPasivos: 400000 
      },
      patrimonio: { 
        utilidadDelEjercicio: 50000000,
        totalPatrimonio: 600000 
      },
    } as any;

    const mockFlujo = {
      resumen: {
        conciliaConBalance: true,
        efectivoFinal: 500000,
        diferenciaConBalance: 0,
      },
    } as any;

    const resultado = validarTriangulacion(50000000, mockBalance, mockFlujo);

    expect(resultado.valido).toBe(true);
    expect(resultado.errores.length).toBe(0);
    expect(resultado.validaciones.balanceCuadra).toBe(true);
    expect(resultado.validaciones.utilidadCierra).toBe(true);
  });

  it('detecta cuando balance no cuadra', () => {
    const mockBalance = {
      ecuacionPatrimonial: { 
        valido: false, 
        activos: 1000000, 
        pasivos: 400000, 
        patrimonio: 500000,
        diferencia: 100000 
      },
      activos: { 
        corrientes: { efectivo: 500000 },
        totalActivos: 1000000 
      },
      pasivos: { 
        corrientes: { escrowAbogados: 100000 },
        totalPasivos: 400000 
      },
      patrimonio: { 
        utilidadDelEjercicio: 50000000,
        totalPatrimonio: 500000 
      },
    } as any;

    const mockFlujo = {
      resumen: {
        conciliaConBalance: true,
        efectivoFinal: 500000,
        diferenciaConBalance: 0,
      },
    } as any;

    const resultado = validarTriangulacion(50000000, mockBalance, mockFlujo);

    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some(e => e.tipo === 'balance')).toBe(true);
  });

  it('detecta inconsistencia en utilidad', () => {
    const mockBalance = {
      ecuacionPatrimonial: { valido: true, activos: 1000000, pasivos: 400000, patrimonio: 600000, diferencia: 0 },
      activos: { corrientes: { efectivo: 500000 }, totalActivos: 1000000 },
      pasivos: { corrientes: { escrowAbogados: 100000 }, totalPasivos: 400000 },
      patrimonio: { utilidadDelEjercicio: 45000000, totalPatrimonio: 600000 },
    } as any;

    const mockFlujo = {
      resumen: { conciliaConBalance: true, efectivoFinal: 500000, diferenciaConBalance: 0 },
    } as any;

    // P&L dice 50M pero Balance dice 45M
    const resultado = validarTriangulacion(50000000, mockBalance, mockFlujo);

    expect(resultado.validaciones.utilidadCierra).toBe(false);
    expect(resultado.errores.some(e => e.tipo === 'utilidad')).toBe(true);
  });
});

describe('calcularCashConversion', () => {
  it('calcula CCC = DSO + DIO - DPO', () => {
    const resultado = calcularCashConversion(
      10000000,  // ventas30Dias
      10000000,  // cuentasPorCobrar (30 días de ventas = DSO 30)
      5000000,   // cuentasPorPagar
      10000000   // costos30Dias
    );

    // DSO = (10M / 10M) * 30 = 30
    // DPO = (5M / 10M) * 30 = 15
    // DIO = 0 (servicios)
    // CCC = 30 + 0 - 15 = 15
    expect(resultado.dso).toBeCloseTo(30, 0);
    expect(resultado.dpo).toBeCloseTo(15, 0);
    expect(resultado.dio).toBe(0);
    expect(resultado.ccc).toBeCloseTo(15, 0);
  });

  it('identifica ciclo negativo como positivo', () => {
    // CxC bajo, CxP alto = cobras antes de pagar
    const resultado = calcularCashConversion(
      10000000,
      3000000,   // DSO bajo
      15000000,  // DPO alto
      10000000
    );

    expect(resultado.ccc).toBeLessThan(0);
    expect(resultado.interpretacion).toBe('negativo');
  });

  it('identifica ciclo positivo como atención', () => {
    const resultado = calcularCashConversion(
      10000000,
      15000000,  // DSO alto
      2000000,   // DPO bajo
      10000000
    );

    expect(resultado.ccc).toBeGreaterThan(10);
    expect(resultado.interpretacion).toBe('positivo');
  });

  it('maneja ventas = 0 sin error', () => {
    const resultado = calcularCashConversion(0, 0, 0, 0);

    expect(resultado.dso).toBe(0);
    expect(resultado.dpo).toBe(0);
    expect(resultado.ccc).toBe(0);
  });
});
