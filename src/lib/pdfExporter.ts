import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

/**
 * Format number to Colombian thousands format (millares)
 */
function formatMillares(value: number): string {
  if (value === 0) return '0';
  // Divide by 1000 to show in thousands
  const enMillares = Math.round(value / 1000);
  return new Intl.NumberFormat('es-CO').format(enMillares);
}

/**
 * Format percentage with 1 decimal
 */
function formatPorcentaje(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format currency in Colombian style
 */
function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface ParametrosMacro {
  año: number;
  inflacionPct: number;
  trm: number;
  tasaRentaPct: number;
  tasaIVAPct: number;
  tasaBanrepPct: number;
  salarioMinimo?: number;
}

interface ImposicionDetalle {
  concepto: string;
  base: string;
  tasa: string;
  montoAnual: number;
  montoAcumulado: number;
  fundamentoLegal: string;
}

interface InformeTributarioData {
  empresa: string;
  nit: string;
  periodoInicio: number;
  periodoFin: number;
  parametrosMacro: ParametrosMacro[];
  imposicionLaboral: ImposicionDetalle[];
  imposicionTributaria: ImposicionDetalle[];
  imposicionTransaccional: ImposicionDetalle[];
  totales: {
    totalImpuestosAnuales: number;
    totalContribucionesAnuales: number;
    totalObligacionesFiscales: number;
    tasaEfectivaTributaria: number;
  };
  resumen: {
    ingresosProyectados: number;
    utilidadBruta: number;
    utilidadOperacional: number;
    utilidadNeta: number;
  };
}

/**
 * Export Colombian Tax Technical Report to PDF
 * Following NIIF standards and Colombian accounting terminology
 */
export function exportarInformeTributarioPDF(data: InformeTributarioData): void {
  const doc = new jsPDF('p', 'mm', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  
  let yPos = 20;

  // Helper to add new page if needed
  const checkPageBreak = (neededSpace: number) => {
    if (yPos + neededSpace > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      yPos = 20;
      addHeader();
    }
  };

  // Header function for all pages
  const addHeader = () => {
    doc.setFillColor(21, 53, 84); // Navy
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME TÉCNICO TRIBUTARIO', marginLeft, 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.empresa}`, pageWidth - marginRight, 10, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPos = 25;
  };

  // ============ PAGE 1: COVER ============
  doc.setFillColor(21, 53, 84);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME TÉCNICO', pageWidth / 2, 35, { align: 'center' });
  doc.text('TRIBUTARIO Y FISCAL', pageWidth / 2, 47, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período de Proyección: ${data.periodoInicio} - ${data.periodoFin}`, pageWidth / 2, 65, { align: 'center' });
  
  yPos = 100;
  doc.setTextColor(0, 0, 0);
  
  // Company info box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(marginLeft, yPos, contentWidth, 40, 3, 3, 'F');
  
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.empresa, marginLeft + 10, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIT: ${data.nit}`, marginLeft + 10, yPos);
  
  yPos += 8;
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CO', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  })}`, marginLeft + 10, yPos);

  yPos += 25;
  
  // Disclaimer box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(marginLeft, yPos, contentWidth, 30, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTA IMPORTANTE:', marginLeft + 5, yPos + 8);
  
  doc.setFont('helvetica', 'normal');
  const disclaimer = 'Este informe presenta proyecciones fiscales basadas en la normativa tributaria colombiana vigente (NIIF para PYMES, Estatuto Tributario). Las cifras están expresadas en miles de pesos colombianos (COP M). Los cálculos son estimativos y no constituyen asesoría tributaria definitiva.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth - 10);
  doc.text(disclaimerLines, marginLeft + 5, yPos + 14);

  yPos += 45;

  // Summary metrics
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN EJECUTIVO DE OBLIGACIONES FISCALES', marginLeft, yPos);
  
  yPos += 10;
  
  const summaryData = [
    ['Concepto', 'Monto Anual Proyectado (COP M)', 'Monto Período Completo (COP M)'],
    ['Total Impuestos', formatMillares(data.totales.totalImpuestosAnuales), formatMillares(data.totales.totalImpuestosAnuales * (data.periodoFin - data.periodoInicio + 1))],
    ['Total Contribuciones', formatMillares(data.totales.totalContribucionesAnuales), formatMillares(data.totales.totalContribucionesAnuales * (data.periodoFin - data.periodoInicio + 1))],
    ['TOTAL OBLIGACIONES FISCALES', formatMillares(data.totales.totalObligacionesFiscales), formatMillares(data.totales.totalObligacionesFiscales * (data.periodoFin - data.periodoInicio + 1))],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [21, 53, 84], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { halign: 'right' },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
    },
    styles: { fontSize: 9 },
    margin: { left: marginLeft, right: marginRight },
  });

  // ============ PAGE 2: MACRO PARAMETERS ============
  doc.addPage();
  addHeader();
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. PARÁMETROS MACROECONÓMICOS DE REFERENCIA', marginLeft, yPos);
  
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Proyecciones basadas en estimaciones del Banco de la República y Ministerio de Hacienda.', marginLeft, yPos);
  
  yPos += 8;

  const macroData = data.parametrosMacro.map(p => [
    p.año.toString(),
    formatPorcentaje(p.inflacionPct),
    formatCOP(p.trm),
    formatPorcentaje(p.tasaRentaPct),
    formatPorcentaje(p.tasaIVAPct),
    formatPorcentaje(p.tasaBanrepPct),
    p.salarioMinimo ? formatCOP(p.salarioMinimo) : 'N/D'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Año', 'Inflación', 'TRM (COP/USD)', 'Renta', 'IVA', 'Tasa Banrep', 'SMMLV']],
    body: macroData,
    theme: 'striped',
    headStyles: { fillColor: [21, 53, 84], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, halign: 'center' },
    columnStyles: {
      0: { fontStyle: 'bold' },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // ============ SECTION 2: LABOR CONTRIBUTIONS ============
  checkPageBreak(80);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. CONTRIBUCIONES PARAFISCALES Y PRESTACIONES SOCIALES', marginLeft, yPos);
  
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Obligaciones laborales según Código Sustantivo del Trabajo y normativa de Seguridad Social.', marginLeft, yPos);
  
  yPos += 8;

  const laborData = data.imposicionLaboral.map(item => [
    item.concepto,
    item.base,
    item.tasa,
    formatMillares(item.montoAnual),
    formatMillares(item.montoAcumulado),
    item.fundamentoLegal
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Base de Cálculo', 'Tasa', 'Anual (M)', 'Acumulado (M)', 'Fundamento Legal']],
    body: laborData,
    theme: 'grid',
    headStyles: { fillColor: [21, 53, 84], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 35, fontSize: 6 },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // ============ SECTION 3: TAX OBLIGATIONS ============
  checkPageBreak(80);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('3. OBLIGACIONES TRIBUTARIAS NACIONALES Y TERRITORIALES', marginLeft, yPos);
  
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Impuestos según Estatuto Tributario Nacional y normativa distrital/municipal.', marginLeft, yPos);
  
  yPos += 8;

  const taxData = data.imposicionTributaria.map(item => [
    item.concepto,
    item.base,
    item.tasa,
    formatMillares(item.montoAnual),
    formatMillares(item.montoAcumulado),
    item.fundamentoLegal
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Base Gravable', 'Tarifa', 'Anual (M)', 'Acumulado (M)', 'Fundamento Legal']],
    body: taxData,
    theme: 'grid',
    headStyles: { fillColor: [21, 53, 84], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 35, fontSize: 6 },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // ============ SECTION 4: TRANSACTIONAL COSTS ============
  checkPageBreak(60);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('4. COSTOS TRANSACCIONALES Y RETENCIONES', marginLeft, yPos);
  
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Costos asociados a operaciones financieras y retenciones practicadas.', marginLeft, yPos);
  
  yPos += 8;

  const transData = data.imposicionTransaccional.map(item => [
    item.concepto,
    item.base,
    item.tasa,
    formatMillares(item.montoAnual),
    formatMillares(item.montoAcumulado),
    item.fundamentoLegal
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Base', 'Tarifa', 'Anual (M)', 'Acumulado (M)', 'Fundamento Legal']],
    body: transData,
    theme: 'grid',
    headStyles: { fillColor: [21, 53, 84], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 30 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 35, fontSize: 6 },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // ============ SECTION 5: CONCLUSIONS ============
  checkPageBreak(60);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('5. ANÁLISIS Y CONCLUSIONES', marginLeft, yPos);
  
  yPos += 10;
  
  const conclusions = [
    `Tasa Efectiva Tributaria Proyectada: ${formatPorcentaje(data.totales.tasaEfectivaTributaria, 2)}`,
    `La carga tributaria total proyectada para el período ${data.periodoInicio}-${data.periodoFin} asciende a ${formatCOP(data.totales.totalObligacionesFiscales * (data.periodoFin - data.periodoInicio + 1))}.`,
    'Las obligaciones parafiscales representan un componente significativo del costo laboral total.',
    'Se recomienda revisión periódica de las proyecciones ante cambios normativos.',
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  conclusions.forEach((conclusion, idx) => {
    const bullet = `${idx + 1}. `;
    const lines = doc.splitTextToSize(conclusion, contentWidth - 10);
    doc.text(bullet + lines[0], marginLeft, yPos);
    if (lines.length > 1) {
      yPos += 5;
      doc.text(lines.slice(1).join(' '), marginLeft + 5, yPos);
    }
    yPos += 8;
  });

  // Footer on last page
  yPos += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 8;
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Documento generado automáticamente por el Motor Financiero LegalMeet Analytics V6.0', marginLeft, yPos);
  yPos += 5;
  doc.text('Marco normativo: NIIF para PYMES (Grupo 2) - Colombia', marginLeft, yPos);
  yPos += 5;
  doc.text(`Cifras en miles de pesos colombianos (COP M) - Fecha de generación: ${new Date().toISOString().split('T')[0]}`, marginLeft, yPos);

  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `Informe_Tributario_${data.empresa.replace(/\s+/g, '_')}_${data.periodoInicio}-${data.periodoFin}.pdf`;
  doc.save(fileName);
}

export type { InformeTributarioData, ImposicionDetalle, ParametrosMacro };
