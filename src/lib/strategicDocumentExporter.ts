import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

// Brand colors
const COLORS = {
  navy: { r: 21, g: 53, b: 84 },
  navyLight: { r: 41, g: 73, b: 104 },
  teal: { r: 34, g: 139, b: 134 },
  white: { r: 255, g: 255, b: 255 },
  lightGray: { r: 245, g: 247, b: 250 },
  gold: { r: 212, g: 175, b: 55 },
  success: { r: 34, g: 197, b: 94 },
  warning: { r: 245, g: 158, b: 11 },
  text: { r: 30, g: 41, b: 59 },
  muted: { r: 100, g: 116, b: 139 },
};

export function exportStrategicDocumentPDF(): void {
  const doc = new jsPDF('p', 'mm', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let yPos = 0;

  const checkPageBreak = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - 30) {
      doc.addPage();
      yPos = 25;
      addPageHeader();
    }
  };

  const addPageHeader = () => {
    doc.setFillColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('LEGALMEET COLOMBIA S.A.S.', marginLeft, 8);
    doc.setFont('helvetica', 'normal');
    doc.text('Análisis Estratégico de Producto', pageWidth - marginRight, 8, { align: 'right' });
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  };

  const addSectionTitle = (title: string, number?: string) => {
    checkPageBreak(20);
    doc.setFillColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
    doc.roundedRect(marginLeft, yPos, contentWidth, 10, 2, 2, 'F');
    doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const text = number ? `${number}. ${title}` : title;
    doc.text(text, marginLeft + 5, yPos + 7);
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    yPos += 15;
  };

  const addSubsectionTitle = (title: string) => {
    checkPageBreak(15);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
    doc.text(title, marginLeft, yPos);
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    yPos += 7;
  };

  const addParagraph = (text: string, indent = 0) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    checkPageBreak(lines.length * 4 + 5);
    doc.text(lines, marginLeft + indent, yPos);
    yPos += lines.length * 4 + 3;
  };

  const addBullet = (text: string, indent = 5) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth - indent - 5);
    checkPageBreak(lines.length * 4 + 3);
    doc.text('•', marginLeft + indent, yPos);
    doc.text(lines, marginLeft + indent + 5, yPos);
    yPos += lines.length * 4 + 2;
  };

  // ============ COVER PAGE ============
  doc.setFillColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
  doc.rect(0, 0, pageWidth, 100, 'F');

  // Gold accent line
  doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.rect(0, 100, pageWidth, 3, 'F');

  // Company name
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('LEGALMEET COLOMBIA S.A.S.', pageWidth / 2, 30, { align: 'center' });

  // Main title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISIS ESTRATÉGICO', pageWidth / 2, 55, { align: 'center' });
  doc.text('DE PRODUCTO', pageWidth / 2, 68, { align: 'center' });

  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Capacidades | Inversión | Valor', pageWidth / 2, 85, { align: 'center' });

  // Info box
  yPos = 120;
  doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  doc.roundedRect(marginLeft, yPos, contentWidth, 50, 3, 3, 'F');

  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Documento para:', marginLeft + 10, yPos + 12);
  doc.setFontSize(14);
  doc.text('Vicepresidencia de Mercado', marginLeft + 10, yPos + 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Versión: 1.0`, marginLeft + 10, yPos + 35);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, marginLeft + 10, yPos + 42);

  // Classification badge
  doc.setFillColor(COLORS.warning.r, COLORS.warning.g, COLORS.warning.b);
  doc.roundedRect(pageWidth - marginRight - 45, yPos + 30, 35, 12, 2, 2, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENCIAL', pageWidth - marginRight - 42, yPos + 38);

  // ============ PAGE 2: TABLE OF CONTENTS ============
  doc.addPage();
  addPageHeader();
  yPos = 25;

  addSectionTitle('TABLA DE CONTENIDOS');

  const tocItems = [
    { num: '1', title: 'Resumen Ejecutivo', page: '3' },
    { num: '2', title: 'Análisis de Capacidades del Producto', page: '4' },
    { num: '3', title: 'Análisis de Inversión y Usos de Fondos', page: '8' },
    { num: '4', title: 'Propuesta de Valor', page: '11' },
    { num: '5', title: 'Análisis de Mercado', page: '14' },
    { num: '6', title: 'Estrategia de Posicionamiento', page: '16' },
    { num: '7', title: 'Recomendaciones para Plan de Marketing', page: '18' },
    { num: 'A', title: 'Anexos', page: '21' },
  ];

  tocItems.forEach(item => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
    doc.text(`${item.num}.`, marginLeft, yPos);
    doc.text(item.title, marginLeft + 10, yPos);
    
    // Dotted line
    doc.setDrawColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.setLineDashPattern([1, 1], 0);
    const titleWidth = doc.getTextWidth(item.title);
    doc.line(marginLeft + 12 + titleWidth, yPos, pageWidth - marginRight - 10, yPos);
    doc.setLineDashPattern([], 0);
    
    doc.text(item.page, pageWidth - marginRight, yPos, { align: 'right' });
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    yPos += 10;
  });

  // ============ PAGE 3: EXECUTIVE SUMMARY ============
  doc.addPage();
  addPageHeader();
  yPos = 25;

  addSectionTitle('RESUMEN EJECUTIVO', '1');

  addSubsectionTitle('1.1 Propósito del Documento');
  addParagraph('Este documento presenta un análisis integral de LegalMeet Analytics como insumo estratégico para la construcción del Plan de Marketing 2026. Incluye:');
  addBullet('Estado actual de capacidades: Inventario completo de funcionalidades y nivel de madurez');
  addBullet('Inversión realizada y pendiente: Análisis de ROI y escenarios de crecimiento');
  addBullet('Propuesta de valor diferenciada: Posicionamiento competitivo por segmento');
  addBullet('Insumos para estrategia de marketing: Canales, mensajes y presupuesto recomendado');

  yPos += 5;
  addSubsectionTitle('1.2 Hallazgos Clave');

  const findings = [
    ['Madurez del producto: 75%', 'Listo para beta comercial, requiere consolidación menor'],
    ['13 fórmulas financieras validadas al 100%', 'Confiabilidad diferenciadora vs. Excel'],
    ['Único en LATAM con normativa tributaria CO nativa', 'Ventaja competitiva sostenible'],
    ['Score técnico: 7.4/10 (mejora de 37%)', 'Arquitectura escalable a 10,000+ usuarios'],
    ['CAC proyectado: $350,000 COP', 'Unit economics saludables (LTV:CAC > 3:1)'],
    ['Inversión total a la fecha: $18,400 USD', 'Eficiencia de capital demostrada'],
    ['TAM Colombia: $9 billones COP/año', 'Mercado atractivo y subatendido'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Hallazgo', 'Implicación']],
    body: findings,
    theme: 'striped',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { cellWidth: 95 } },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  addSubsectionTitle('1.3 Recomendación Estratégica');

  doc.setFillColor(COLORS.teal.r, COLORS.teal.g, COLORS.teal.b);
  doc.roundedRect(marginLeft, yPos, contentWidth, 30, 3, 3, 'F');
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const recommendation = 'Recomendamos proceder con el Escenario B (Crecimiento) con una inversión de $51,000 USD en los próximos 6 meses, enfocando los esfuerzos comerciales en startups Seed/Pre-Seed y fondos de inversión/aceleradoras. Esta estrategia permite validar el product-market fit con 200 usuarios pagos antes de escalar.';
  const recLines = doc.splitTextToSize(recommendation, contentWidth - 10);
  doc.text(recLines, marginLeft + 5, yPos + 8);
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);

  // ============ PAGE 4: CAPABILITIES ============
  doc.addPage();
  addPageHeader();
  yPos = 25;

  addSectionTitle('ANÁLISIS DE CAPACIDADES DEL PRODUCTO', '2');

  addSubsectionTitle('2.1 Inventario de Funcionalidades');

  const modules = [
    ['Proyecciones', 'Simulación financiera 2026-2031', '✅ Activo', 'Único en LATAM'],
    ['Unit Economics', 'LTV, CAC, Burn Rate, Runway', '✅ Activo', 'Cálculo automático'],
    ['Estados Financieros', 'ERI, Balance, Flujo de Caja', '✅ Activo', 'NIIF Colombia'],
    ['Tributario', 'Renta, ICA, GMF, ReteFuente', '✅ Activo', 'Normativa DIAN'],
    ['Escenarios', 'Comparador multi-variable', '✅ Activo', 'Análisis sensibilidad'],
    ['Alertas', '15 alertas inteligentes', '✅ Activo', 'Predictivo'],
    ['Diagnóstico', 'Scoring de salud financiera', '✅ Activo', 'Benchmark industria'],
    ['Exportación', 'Excel + PDF profesional', '✅ Activo', 'Investor-ready'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Módulo', 'Funcionalidad', 'Estado', 'Diferenciador']],
    body: modules,
    theme: 'grid',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 } },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  addSubsectionTitle('2.2 Catálogo de Ingresos');

  const ingresos = [
    ['ING-001', 'Audiencia Virtual', 'Videollamada con abogado', '$150,000', '19%'],
    ['ING-002', 'Firma Electrónica', 'Documento con validez jurídica', '$85,000', '19%'],
    ['ING-003', 'Escritura Digital', 'Elaboración documento legal', '$250,000', '19%'],
    ['ING-004', 'Registro Público', 'Gestión entidades oficiales', '$180,000', '19%'],
    ['ING-005', 'Suscripción Básica', 'Plan mensual empresarial', '$89,000', '19%'],
    ['ING-006', 'Suscripción Premium', 'Plan con soporte prioritario', '$189,000', '19%'],
    ['ING-007', 'Consulta Express', 'Asesoría legal 15 min', '$45,000', '19%'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Código', 'Concepto', 'Descripción', 'Precio Base', 'IVA']],
    body: ingresos,
    theme: 'striped',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold' }, 3: { halign: 'right' }, 4: { halign: 'center' } },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // ============ PAGE 5: CAPABILITIES CONTINUED ============
  doc.addPage();
  addPageHeader();
  yPos = 25;

  addSubsectionTitle('2.3 Capacidades Únicas (Moat)');

  const moats = [
    {
      title: 'Triangulación Contable Automática',
      desc: 'Validación automática de coherencia entre ERI, Balance y Flujo de Caja',
      impact: 'Elimina errores humanos, genera confianza en inversores',
    },
    {
      title: 'Cumplimiento Tributario Colombiano Nativo',
      desc: 'Renta (35%), ICA (0.966%), GMF (4x1000), ReteFuente (11%) integrados',
      impact: 'Ahorra 40+ horas de contabilidad por año',
    },
    {
      title: 'Alertas Predictivas de Runway',
      desc: 'Sistema de 15 alertas que detecta problemas con semanas de anticipación',
      impact: 'Previene crisis financieras antes de que sea tarde',
    },
    {
      title: 'Unit Economics Automatizados',
      desc: 'LTV, CAC, Payback Period calculados automáticamente',
      impact: 'Inversores exigen estas métricas para funding',
    },
  ];

  moats.forEach((moat, idx) => {
    doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
    doc.roundedRect(marginLeft, yPos, contentWidth, 22, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
    doc.text(`${idx + 1}. ${moat.title}`, marginLeft + 5, yPos + 7);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    doc.text(moat.desc, marginLeft + 5, yPos + 13);
    
    doc.setTextColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
    doc.text(`→ ${moat.impact}`, marginLeft + 5, yPos + 19);
    
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    yPos += 27;
  });

  yPos += 5;
  addSubsectionTitle('2.4 Mapa de Madurez');

  const maturity = [
    ['Proyecciones', '80%', '████████░░'],
    ['Unit Economics', '80%', '████████░░'],
    ['Estados Financieros', '80%', '████████░░'],
    ['Tributario', '80%', '████████░░'],
    ['Escenarios', '70%', '███████░░░'],
    ['Alertas', '70%', '███████░░░'],
    ['Diagnóstico', '60%', '██████░░░░'],
    ['Exportación', '70%', '███████░░░'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Módulo', 'Madurez', 'Progreso']],
    body: maturity,
    theme: 'striped',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'center' }, 2: { fontStyle: 'bold', textColor: [COLORS.teal.r, COLORS.teal.g, COLORS.teal.b] } },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 8;

  doc.setFillColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
  doc.roundedRect(marginLeft, yPos, contentWidth, 12, 2, 2, 'F');
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PROMEDIO GENERAL: 75% — LISTO PARA BETA COMERCIAL', pageWidth / 2, yPos + 8, { align: 'center' });
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);

  // ============ PAGE 6: INVESTMENT ============
  doc.addPage();
  addPageHeader();
  yPos = 25;

  addSectionTitle('ANÁLISIS DE INVERSIÓN Y USOS DE FONDOS', '3');

  addSubsectionTitle('3.1 Inversión Realizada a la Fecha');

  const invested = [
    ['Desarrollo inicial (MVP)', '$12,000', 'Producto funcional con 8 módulos'],
    ['Ciclos de mejora 1-4', '$5,200', 'Score técnico 5.4 → 7.4 (+37%)'],
    ['Infraestructura anual', '$1,200', 'Operación continua 24/7'],
    ['TOTAL INVERTIDO', '$18,400', 'Plataforma Beta-Ready (75% madurez)'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Monto USD', 'Resultado Obtenido']],
    body: invested,
    theme: 'grid',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    didParseCell: (data) => {
      if (data.row.index === 3) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b];
      }
    },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  addSubsectionTitle('3.2 Escenarios de Inversión');

  // Scenario A
  doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  doc.roundedRect(marginLeft, yPos, contentWidth, 8, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Escenario A: Consolidación — $6,000 USD (6 semanas)', marginLeft + 5, yPos + 5.5);
  yPos += 12;

  const scenarioA = [
    ['TypeScript strict + refactoring', '$2,000', '2 semanas', 'Score 7.4 → 8.0'],
    ['Cobertura tests 80%', '$3,000', '3 semanas', 'Menos bugs'],
    ['Documentación', '$1,000', '1 semana', 'Onboarding rápido'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Monto', 'Timeline', 'Resultado']],
    body: scenarioA,
    theme: 'striped',
    headStyles: { fillColor: [COLORS.muted.r, COLORS.muted.g, COLORS.muted.b], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 8;

  // Scenario B (Recommended)
  doc.setFillColor(COLORS.teal.r, COLORS.teal.g, COLORS.teal.b);
  doc.roundedRect(marginLeft, yPos, contentWidth, 8, 2, 2, 'F');
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Escenario B: Crecimiento (RECOMENDADO) — $51,000 USD (6 meses)', marginLeft + 5, yPos + 5.5);
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  yPos += 12;

  const scenarioB = [
    ['Todo del Escenario A', '$6,000', '6 semanas', 'Base técnica sólida'],
    ['Integraciones contables (Siigo, Alegra)', '$15,000', '8 semanas', 'Adopción contadores'],
    ['Módulo reportes avanzados', '$10,000', '6 semanas', 'Diferenciación premium'],
    ['Marketing y ventas', '$20,000', 'Continuo', 'Adquisición clientes'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Monto', 'Timeline', 'Resultado']],
    body: scenarioB,
    theme: 'striped',
    headStyles: { fillColor: [COLORS.teal.r, COLORS.teal.g, COLORS.teal.b], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 8;

  // Scenario C
  doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  doc.roundedRect(marginLeft, yPos, contentWidth, 8, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Escenario C: Expansión (Ops & Risk) — $216,000 USD (18 meses)', marginLeft + 5, yPos + 5.5);
  yPos += 12;

  const scenarioC = [
    ['Todo del Escenario B', '$51,000', '6 meses', 'Base comercial validada'],
    ['Módulo Ops & Risk completo', '$93,000', '12 meses', 'Nuevo revenue stream'],
    ['Equipo dedicado (2 devs)', '$72,000', '12 meses', 'Velocidad 3×'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Monto', 'Timeline', 'Resultado']],
    body: scenarioC,
    theme: 'striped',
    headStyles: { fillColor: [COLORS.muted.r, COLORS.muted.g, COLORS.muted.b], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: marginLeft, right: marginRight },
  });

  // ============ PAGE 7: ROI ============
  doc.addPage();
  addPageHeader();
  yPos = 25;

  addSubsectionTitle('3.3 Proyección de ROI por Escenario');

  const roiData = [
    ['Inversión USD', '$6,000', '$51,000', '$216,000'],
    ['Usuarios Año 1', '50', '200', '500'],
    ['MRR Año 1 (COP)', '$25M', '$100M', '$250M'],
    ['ARR Año 1 (COP)', '$300M', '$1.2B', '$3B'],
    ['Payback Period', '3 meses', '8 meses', '14 meses'],
    ['ROI Año 1', '400%', '180%', '120%'],
    ['Riesgo', 'Bajo', 'Medio', 'Alto'],
    ['Recomendación', '⚠️ Solo consolidación', '✅ ÓPTIMO', '⚠️ Post-validación'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Escenario A', 'Escenario B', 'Escenario C']],
    body: roiData,
    theme: 'grid',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, halign: 'center' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' }, 2: { fillColor: [220, 252, 231] } },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  addSubsectionTitle('3.4 Distribución de Fondos — Escenario B');

  const distribution = [
    ['Desarrollo de Producto', '61%', '$31,000', 'Backend, Frontend, Testing, DevOps'],
    ['Comercial y Marketing', '31%', '$16,000', 'Ads, Contenido, Eventos, CRM'],
    ['Operaciones', '8%', '$4,000', 'Infraestructura, Soporte, Legal'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Categoría', '%', 'Monto', 'Incluye']],
    body: distribution,
    theme: 'striped',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'center' }, 2: { halign: 'right' } },
    margin: { left: marginLeft, right: marginRight },
  });

  // ============ PAGE 8: VALUE PROPOSITION ============
  doc.addPage();
  addPageHeader();
  yPos = 25;

  addSectionTitle('PROPUESTA DE VALOR', '4');

  addSubsectionTitle('4.1 Problema que Resolvemos');

  const problems = [
    ['Proyecciones en Excel frágiles', '40% startups rechazadas', '13 fórmulas validadas'],
    ['Desconocimiento unit economics', 'Decisiones sin datos', 'Dashboard automático LTV, CAC'],
    ['Cumplimiento tributario complejo', 'Multas ~$5M COP', 'Cálculos DIAN integrados'],
    ['Estados financieros manuales', '40+ horas/mes', 'Generación automática NIIF'],
    ['Falta de alertas tempranas', 'Crisis sorpresivas', '15 alertas predictivas'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Dolor', 'Impacto', 'Nuestra Solución']],
    body: problems,
    theme: 'grid',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 2: { textColor: [COLORS.success.r, COLORS.success.g, COLORS.success.b] } },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  addSubsectionTitle('4.2 Propuesta de Valor por Segmento');

  // Segment boxes
  const segments = [
    {
      name: 'Startups Seed/Pre-Seed',
      before: 'Excel con errores, inversores rechazan',
      after: 'Proyecciones profesionales en 10 min',
      value: 'Tiempo de preparación: 2 semanas → 1 hora',
    },
    {
      name: 'PyMEs en Crecimiento',
      before: 'Contador externo costoso ($2M/mes)',
      after: 'Proyecciones sin depender del contador',
      value: 'Ahorro en consultoría: $24M COP/año',
    },
    {
      name: 'Fondos de Inversión',
      before: 'Due diligence manual (2-4 semanas)',
      after: 'Análisis estandarizado en horas',
      value: 'Tiempo de evaluación: 2 semanas → 2 días',
    },
  ];

  segments.forEach(seg => {
    checkPageBreak(30);
    doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
    doc.roundedRect(marginLeft, yPos, contentWidth, 25, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
    doc.text(seg.name, marginLeft + 5, yPos + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    doc.text(`ANTES: ${seg.before}`, marginLeft + 5, yPos + 12);
    doc.setTextColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
    doc.text(`DESPUÉS: ${seg.after}`, marginLeft + 5, yPos + 17);
    doc.setTextColor(COLORS.teal.r, COLORS.teal.g, COLORS.teal.b);
    doc.setFont('helvetica', 'bold');
    doc.text(`VALOR: ${seg.value}`, marginLeft + 5, yPos + 22);

    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    yPos += 30;
  });

  // ============ PAGE 9: COMPETITIVE ============
  doc.addPage();
  addPageHeader();
  yPos = 25;

  addSubsectionTitle('4.3 Diferenciadores Competitivos');

  const competitive = [
    ['Precio mensual', '$89K-$189K', 'Gratis', '$5M+', '$200K-$500K'],
    ['Curva aprendizaje', 'Baja (10 min)', 'Alta', 'Muy Alta', 'Media'],
    ['Normativa CO', '✅ Nativo', '❌ Manual', '⚠️ Parcial', '❌ No'],
    ['Unit Economics', '✅ Automático', '❌ Manual', '⚠️ Módulo extra', '⚠️ Básico'],
    ['Investor-ready', '✅', '❌', '⚠️', '⚠️'],
    ['Alertas predictivas', '✅ 15 alertas', '❌', '⚠️', '❌'],
    ['Implementación', 'Minutos', 'N/A', '6-12 meses', 'Semanas'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Atributo', 'LegalMeet', 'Excel', 'ERPs', 'Otros SaaS']],
    body: competitive,
    theme: 'grid',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, halign: 'center' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' }, 1: { fillColor: [220, 252, 231] } },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // ============ MARKET ANALYSIS ============
  addSectionTitle('ANÁLISIS DE MERCADO', '5');

  addSubsectionTitle('5.1 TAM / SAM / SOM');

  const market = [
    ['TAM', '1.5M empresas', '$500K COP/mes', '$9B COP/año', '~$2.2B USD'],
    ['SAM', '150K digitalizadas', '$400K COP/mes', '$720B COP/año', '~$180M USD'],
    ['SOM Año 1', '500 empresas', '$350K COP/mes', '$2.1B COP/año', '~$525K USD'],
    ['SOM Año 3', '5,000 empresas', '$500K COP/mes', '$30B COP/año', '~$7.5M USD'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Mercado', 'Empresas', 'Ticket', 'Anual COP', 'Anual USD']],
    body: market,
    theme: 'striped',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  addSubsectionTitle('5.2 Segmentación Prioritaria');

  const segmentation = [
    ['Startups Seed/Pre-Seed', '5,000', 'Docs para inversores', 'Alta', '🥇'],
    ['Fondos/Aceleradoras', '100', 'Due diligence', 'Alta (B2B)', '🥇'],
    ['PyMEs Tech', '20,000', 'Control financiero', 'Media-Alta', '🥈'],
    ['Contadores', '10,000', 'Herramienta clientes', 'Media', '🥉'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Segmento', 'Tamaño', 'Dolor Principal', 'Disposición Pago', 'Prioridad']],
    body: segmentation,
    theme: 'striped',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 4: { halign: 'center' } },
    margin: { left: marginLeft, right: marginRight },
  });

  // ============ PAGE 10: POSITIONING ============
  doc.addPage();
  addPageHeader();
  yPos = 25;

  addSectionTitle('ESTRATEGIA DE POSICIONAMIENTO', '6');

  addSubsectionTitle('6.1 Declaración de Posicionamiento');

  doc.setFillColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
  doc.roundedRect(marginLeft, yPos, contentWidth, 45, 3, 3, 'F');

  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const positioning = [
    'Para startups y PyMEs colombianas',
    'que necesitan proyectar sus finanzas y tomar decisiones basadas en datos',
    '',
    'LegalMeet es la plataforma de inteligencia financiera',
    'que automatiza proyecciones, unit economics y cumplimiento tributario',
    '',
    'A diferencia de Excel o ERPs costosos',
    'LegalMeet es simple, rápido y diseñado para la normativa colombiana',
  ];

  let posY = yPos + 8;
  positioning.forEach(line => {
    if (line === '') {
      posY += 3;
    } else {
      doc.text(line, pageWidth / 2, posY, { align: 'center' });
      posY += 5;
    }
  });

  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  yPos += 55;

  addSubsectionTitle('6.2 Mensajes Clave por Audiencia');

  const messages = [
    ['Founders/CEOs', '"Deja de adivinar tu runway. LegalMeet te dice exactamente cuántos meses de vida tiene tu startup."'],
    ['CFOs', '"Proyecciones que cuadran. Estados financieros que se triangúlan. Sin errores humanos."'],
    ['Contadores', '"Dale a tus clientes dashboards profesionales. Tú supervisas, la plataforma calcula."'],
    ['Inversores', '"Due diligence financiero estandarizado. Compara startups en minutos, no semanas."'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Audiencia', 'Mensaje Principal']],
    body: messages,
    theme: 'striped',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 1: { fontStyle: 'italic' } },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  addSubsectionTitle('6.3 Pilares de Comunicación');

  const pillars = [
    ['Confiabilidad', '"Números que cuadran"', '13 fórmulas validadas, triangulación automática'],
    ['Simplicidad', '"Finanzas sin complicaciones"', 'Proyección en 10 min, sin capacitación'],
    ['Colombianidad', '"Hecho para tu realidad"', 'ICA, GMF, ReteFuente, NIIF Colombia'],
    ['Accionabilidad', '"Decide con datos"', '15 alertas predictivas, diagnóstico scoring'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Pilar', 'Mensaje', 'Prueba/Evidencia']],
    body: pillars,
    theme: 'grid',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold' } },
    margin: { left: marginLeft, right: marginRight },
  });

  // ============ PAGE 11: MARKETING PLAN ============
  doc.addPage();
  addPageHeader();
  yPos = 25;

  addSectionTitle('RECOMENDACIONES PARA PLAN DE MARKETING', '7');

  addSubsectionTitle('7.1 Estrategia Go-to-Market');

  const gtmPhases = [
    ['Fase 1: Beta Cerrada', 'Meses 1-2', '20-50 usuarios', 'Feedback, no ingresos', 'Invitación directa'],
    ['Fase 2: Lanzamiento Controlado', 'Meses 3-4', '100-200 usuarios', 'Conversión y retención', 'Content, LinkedIn'],
    ['Fase 3: Crecimiento', 'Meses 5-12', '500+ usuarios', 'Eficiencia CAC', 'Paid, partnerships'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Fase', 'Timeline', 'Meta', 'Foco', 'Canales']],
    body: gtmPhases,
    theme: 'grid',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold' } },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  addSubsectionTitle('7.2 Canales Recomendados');

  const channels = [
    ['Contenido + SEO', 'Bajo', '$500K COP', '🥇 Alta', 'Compounding returns'],
    ['Comunidades Startup', 'Bajo', '$300K COP', '🥇 Alta', 'Acceso directo ICP'],
    ['Partnerships', 'Bajo', '$200K COP', '🥇 Alta', 'Credibilidad'],
    ['LinkedIn Ads', 'Medio', '$1.5M COP', '🥈 Media', 'Targeting B2B'],
    ['Eventos', 'Medio', '$1M COP', '🥈 Media', 'Relaciones'],
    ['Google Ads', 'Alto', '$2M COP', '🥉 Baja', 'Intent alto pero costoso'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Canal', 'Inversión', 'CAC Esperado', 'Prioridad', 'Justificación']],
    body: channels,
    theme: 'striped',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  addSubsectionTitle('7.3 Presupuesto Marketing Año 1');

  const budget = [
    ['Contenido y SEO', '$2,000', '$2,000', '$3,000', '$3,000', '$10,000'],
    ['Paid Ads', '$1,000', '$3,000', '$5,000', '$6,000', '$15,000'],
    ['Eventos', '$1,000', '$2,000', '$3,000', '$4,000', '$10,000'],
    ['Partnerships', '$500', '$1,000', '$1,500', '$2,000', '$5,000'],
    ['Herramientas', '$500', '$500', '$500', '$500', '$2,000'],
    ['TOTAL', '$5,000', '$8,500', '$13,000', '$15,500', '$42,000'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Categoría', 'Q1', 'Q2', 'Q3', 'Q4', 'TOTAL']],
    body: budget,
    theme: 'grid',
    headStyles: { fillColor: [COLORS.navy.r, COLORS.navy.g, COLORS.navy.b], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, halign: 'right' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    didParseCell: (data) => {
      if (data.row.index === 5) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b];
      }
    },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 8;

  doc.setFillColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
  doc.roundedRect(marginLeft, yPos, contentWidth, 15, 2, 2, 'F');
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Meta: 500 clientes al cierre de Año 1 | CAC Promedio: $84 USD (~$350,000 COP)', pageWidth / 2, yPos + 6, { align: 'center' });
  doc.text('Eficiencia: 500 clientes / $42,000 = $84/cliente', pageWidth / 2, yPos + 12, { align: 'center' });
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);

  // ============ FINAL PAGE: FOOTER ============
  doc.addPage();
  addPageHeader();
  yPos = 25;

  addSectionTitle('ANEXOS', 'A');

  addParagraph('Los siguientes anexos están disponibles en la versión completa del documento:');
  yPos += 5;

  addBullet('Anexo A: Glosario de Términos Financieros (LTV, CAC, MRR, ARR, Burn Rate, Runway, Churn, ARPU, etc.)');
  addBullet('Anexo B: Screenshots del Producto (Dashboard, Proyecciones, Estados Financieros, Tributario, Alertas)');
  addBullet('Anexo C: Casos de Uso Detallados (3 casos narrativos de usuarios típicos)');
  addBullet('Anexo D: Testimonios de Beta (pendiente recopilación durante fase beta)');
  addBullet('Anexo E: Roadmap de Producto Detallado (Timeline visual 2026-2027)');

  yPos += 20;

  // Closing box
  doc.setFillColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
  doc.roundedRect(marginLeft, yPos, contentWidth, 50, 3, 3, 'F');

  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('LEGALMEET COLOMBIA S.A.S.', pageWidth / 2, yPos + 12, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Documento preparado para la Vicepresidencia de Mercado', pageWidth / 2, yPos + 22, { align: 'center' });
  doc.text('Como insumo para el Plan de Marketing y Estrategia Comercial 2026', pageWidth / 2, yPos + 30, { align: 'center' });

  doc.setFontSize(8);
  doc.text(`Versión 1.0 — ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth / 2, yPos + 42, { align: 'center' });

  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);

  yPos += 65;

  // Legal footer
  doc.setFontSize(7);
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text('© 2024 LegalMeet Colombia S.A.S. Todos los derechos reservados.', marginLeft, yPos);
  doc.text('Este documento es confidencial y está destinado únicamente al uso interno de la organización.', marginLeft, yPos + 4);
  doc.text('Generado automáticamente por LegalMeet Analytics V6.0', marginLeft, yPos + 8);

  // Add page numbers to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Download
  const fileName = `LegalMeet_Analisis_Estrategico_VP_Mercado_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
