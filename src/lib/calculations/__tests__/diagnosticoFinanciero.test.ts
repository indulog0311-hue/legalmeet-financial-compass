import { describe, it, expect } from 'vitest';
import { 
  ejecutarDiagnosticoUnitario, 
  formatearFlujoDinero 
} from '../diagnosticoFinanciero';

describe('ejecutarDiagnosticoUnitario', () => {
  describe('Cálculos Básicos', () => {
    it('calcula diagnóstico correctamente', () => {
      const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 0.7);
      
      expect(diagnostico).toBeDefined();
      expect(diagnostico.precioEntrada).toBeGreaterThanOrEqual(0);
    });

    it('calcula con diferentes volúmenes', () => {
      const diag1 = ejecutarDiagnosticoUnitario('ING-TRANS-01', 1, 0.7);
      const diag10 = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 0.7);
      
      expect(diag10.volumen).toBe(10);
      expect(diag1.volumen).toBe(1);
    });

    it('maneja mix digital 100%', () => {
      const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 1.0);
      
      expect(diagnostico).toBeDefined();
      expect(diagnostico.mixDigital).toBe(1.0);
    });

    it('maneja mix digital 0% (solo efectivo)', () => {
      const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 0.0);
      
      expect(diagnostico).toBeDefined();
      expect(diagnostico.mixDigital).toBe(0.0);
    });
  });

  describe('Flujo de Dinero', () => {
    it('genera pasos del flujo de dinero', () => {
      const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 0.7);
      
      expect(diagnostico.flujo).toBeDefined();
      expect(Array.isArray(diagnostico.flujo)).toBe(true);
      expect(diagnostico.flujo.length).toBeGreaterThan(0);
    });

    it('cada paso tiene estructura correcta', () => {
      const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 0.7);
      
      diagnostico.flujo.forEach(paso => {
        expect(paso).toHaveProperty('orden');
        expect(paso).toHaveProperty('concepto');
        expect(paso).toHaveProperty('monto');
        expect(paso).toHaveProperty('acumulado');
      });
    });
  });

  describe('Margen de Contribución', () => {
    it('calcula margen de contribución', () => {
      const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 0.7);
      
      expect(diagnostico.margenContribucion).toBeDefined();
      expect(typeof diagnostico.margenContribucion).toBe('number');
    });

    it('calcula margen de contribución porcentual', () => {
      const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 0.7);
      
      expect(diagnostico.margenContribucionPct).toBeDefined();
      expect(typeof diagnostico.margenContribucionPct).toBe('number');
    });
  });

  describe('Punto de Equilibrio', () => {
    it('calcula punto de equilibrio en unidades', () => {
      const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 0.7);
      
      expect(diagnostico.puntoEquilibrioUnidades).toBeDefined();
      expect(typeof diagnostico.puntoEquilibrioUnidades).toBe('number');
    });
  });

  describe('Alertas', () => {
    it('genera array de alertas', () => {
      const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 1, 0.7);
      
      expect(diagnostico.alertas).toBeDefined();
      expect(Array.isArray(diagnostico.alertas)).toBe(true);
    });

    it('alertas tienen estructura correcta', () => {
      const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 0.7);
      
      diagnostico.alertas.forEach(alerta => {
        expect(alerta).toHaveProperty('severidad');
        expect(alerta).toHaveProperty('categoria');
        expect(alerta).toHaveProperty('titulo');
        expect(alerta).toHaveProperty('descripcion');
      });
    });
  });

  describe('Verificaciones', () => {
    it('incluye verificaciones de auditoría', () => {
      const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 0.7);
      
      expect(diagnostico.verificaciones).toBeDefined();
      expect(diagnostico.verificaciones).toHaveProperty('grossUpCorrecto');
      expect(diagnostico.verificaciones).toHaveProperty('smsSoloRural');
      expect(diagnostico.verificaciones).toHaveProperty('pasarelaSegmentada');
      expect(diagnostico.verificaciones).toHaveProperty('icaSobreIngresos');
      expect(diagnostico.verificaciones).toHaveProperty('cloudEscalable');
    });
  });

  describe('Edge Cases', () => {
    it('maneja volumen 0', () => {
      const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 0, 0.7);
      
      expect(diagnostico).toBeDefined();
      expect(diagnostico.volumen).toBe(0);
    });

    it('maneja SKU inexistente con fallback', () => {
      // Debe manejar gracefully aunque no encuentre el SKU
      const diagnostico = ejecutarDiagnosticoUnitario('SKU-INEXISTENTE', 10, 0.7);
      
      expect(diagnostico).toBeDefined();
      expect(diagnostico.skuAnalizado).toBe('SKU-INEXISTENTE');
    });

    it('mantiene timestamp válido', () => {
      const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 0.7);
      
      expect(diagnostico.timestamp).toBeInstanceOf(Date);
    });
  });
});

describe('formatearFlujoDinero', () => {
  it('formatea el flujo de dinero como string', () => {
    const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 0.7);
    const formateado = formatearFlujoDinero(diagnostico);
    
    expect(typeof formateado).toBe('string');
    expect(formateado.length).toBeGreaterThan(0);
  });

  it('incluye información del diagnóstico', () => {
    const diagnostico = ejecutarDiagnosticoUnitario('ING-TRANS-01', 10, 0.7);
    const formateado = formatearFlujoDinero(diagnostico);
    
    // Debe contener alguna información numérica
    expect(formateado).toMatch(/\d/);
  });
});
