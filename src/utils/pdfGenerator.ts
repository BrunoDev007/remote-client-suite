import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TechnicalReport } from '@/pages/TechnicalReports';

export const generatePDF = async (report: TechnicalReport) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 20;
  let yPosition = 30;

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.6);
  };

  // Helper function to add a visual block separator
  const addBlockSeparator = (y: number) => {
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    return y + 10;
  };

  // Helper function to create a bordered section
  const addSectionBox = (x: number, y: number, width: number, height: number) => {
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.rect(x, y, width, height);
  };

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RELATÓRIO TÉCNICO', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  pdf.setFontSize(14);
  pdf.text(report.title, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;
  
  // Client and generation info block
  const infoBoxHeight = 25;
  addSectionBox(margin, yPosition - 5, pageWidth - 2 * margin, infoBoxHeight);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CLIENTE:', margin + 5, yPosition + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(report.client_name, margin + 30, yPosition + 5);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('GERADO EM:', margin + 5, yPosition + 15);
  pdf.setFont('helvetica', 'normal');
  pdf.text(format(new Date(report.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), margin + 45, yPosition + 15);
  
  yPosition += infoBoxHeight + 15;

  // Content based on report type
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);

  if (report.type === 'monitoring') {
    // Section Header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, 18, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('RELATÓRIO DE ACOMPANHAMENTO', margin + 5, yPosition + 10);
    yPosition += 25;
    
    // Basic Information Block
    if (report.data.visitDate || report.data.technician) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('INFORMAÇÕES BÁSICAS', margin, yPosition);
      yPosition += 10;
      
      const basicInfoHeight = 20;
      addSectionBox(margin, yPosition - 5, pageWidth - 2 * margin, basicInfoHeight);
      
      pdf.setFont('helvetica', 'normal');
      if (report.data.visitDate) {
        pdf.text(`Data da Visita: ${format(new Date(report.data.visitDate), "dd/MM/yyyy", { locale: ptBR })}`, margin + 5, yPosition + 5);
      }
      if (report.data.technician) {
        pdf.text(`Técnico Responsável: ${report.data.technician}`, margin + 5, yPosition + 12);
      }
      yPosition += basicInfoHeight + 15;
    }

    // Problem Block
    if (report.data.problemIdentified) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('PROBLEMA IDENTIFICADO', margin, yPosition);
      yPosition += 10;
      
      const problemBoxStart = yPosition - 5;
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.problemIdentified, margin + 5, yPosition + 5, pageWidth - 2 * margin - 10);
      const problemBoxHeight = yPosition - problemBoxStart + 5;
      addSectionBox(margin, problemBoxStart, pageWidth - 2 * margin, problemBoxHeight);
      yPosition += 15;
    }

    // Solution Block
    if (report.data.solutionApplied) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('SOLUÇÃO APLICADA', margin, yPosition);
      yPosition += 10;
      
      const solutionBoxStart = yPosition - 5;
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.solutionApplied, margin + 5, yPosition + 5, pageWidth - 2 * margin - 10);
      const solutionBoxHeight = yPosition - solutionBoxStart + 5;
      addSectionBox(margin, solutionBoxStart, pageWidth - 2 * margin, solutionBoxHeight);
      yPosition += 15;
    }

    // Observations Block
    if (report.data.observations) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('OBSERVAÇÕES', margin, yPosition);
      yPosition += 10;
      
      const obsBoxStart = yPosition - 5;
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.observations, margin + 5, yPosition + 5, pageWidth - 2 * margin - 10);
      const obsBoxHeight = yPosition - obsBoxStart + 5;
      addSectionBox(margin, obsBoxStart, pageWidth - 2 * margin, obsBoxHeight);
      yPosition += 15;
    }

    // Status Block
    if (report.data.status) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('STATUS FINAL', margin, yPosition);
      yPosition += 10;
      
      addSectionBox(margin, yPosition - 5, pageWidth - 2 * margin, 15);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Status: ${report.data.status}`, margin + 5, yPosition + 5);
      yPosition += 20;
    }
  }

  if (report.type === 'periodic') {
    // Section Header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, 18, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('RELATÓRIO DE ATIVIDADES PERIÓDICAS', margin + 5, yPosition + 10);
    yPosition += 25;
    
    // Basic Information Block
    if (report.data.subcategory || report.data.executionDate || report.data.equipment) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('INFORMAÇÕES BÁSICAS', margin, yPosition);
      yPosition += 10;
      
      const basicInfoHeight = 25;
      addSectionBox(margin, yPosition - 5, pageWidth - 2 * margin, basicInfoHeight);
      
      pdf.setFont('helvetica', 'normal');
      let linePos = yPosition + 5;
      if (report.data.subcategory) {
        pdf.text(`Subcategoria: ${report.data.subcategory}`, margin + 5, linePos);
        linePos += 7;
      }
      if (report.data.executionDate) {
        pdf.text(`Data da Execução: ${format(new Date(report.data.executionDate), "dd/MM/yyyy", { locale: ptBR })}`, margin + 5, linePos);
        linePos += 7;
      }
      if (report.data.equipment) {
        pdf.text(`Equipamento: ${report.data.equipment}`, margin + 5, linePos);
      }
      yPosition += basicInfoHeight + 15;
    }

    // Activity Block
    if (report.data.activityPerformed) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('ATIVIDADE REALIZADA', margin, yPosition);
      yPosition += 10;
      
      const activityBoxStart = yPosition - 5;
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.activityPerformed, margin + 5, yPosition + 5, pageWidth - 2 * margin - 10);
      const activityBoxHeight = yPosition - activityBoxStart + 5;
      addSectionBox(margin, activityBoxStart, pageWidth - 2 * margin, activityBoxHeight);
      yPosition += 15;
    }

    // Observations Block
    if (report.data.observations) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('OBSERVAÇÕES', margin, yPosition);
      yPosition += 10;
      
      const obsBoxStart = yPosition - 5;
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.observations, margin + 5, yPosition + 5, pageWidth - 2 * margin - 10);
      const obsBoxHeight = yPosition - obsBoxStart + 5;
      addSectionBox(margin, obsBoxStart, pageWidth - 2 * margin, obsBoxHeight);
      yPosition += 15;
    }

    // Result Block
    if (report.data.result) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('RESULTADO', margin, yPosition);
      yPosition += 10;
      
      addSectionBox(margin, yPosition - 5, pageWidth - 2 * margin, 15);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Resultado: ${report.data.result}`, margin + 5, yPosition + 5);
      yPosition += 20;
    }
  }

  if (report.type === 'backup') {
    // Section Header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, 18, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('RELATÓRIO DE BACKUP E SEGURANÇA', margin + 5, yPosition + 10);
    yPosition += 25;
    
    // Status Information Block
    if (report.data.backupStatus || report.data.hdLifespan || report.data.lastValidBackup) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('STATUS DO SISTEMA', margin, yPosition);
      yPosition += 10;
      
      const statusInfoHeight = 25;
      addSectionBox(margin, yPosition - 5, pageWidth - 2 * margin, statusInfoHeight);
      
      pdf.setFont('helvetica', 'normal');
      let linePos = yPosition + 5;
      if (report.data.backupStatus) {
        pdf.text(`Status dos Backups: ${report.data.backupStatus}`, margin + 5, linePos);
        linePos += 7;
      }
      if (report.data.hdLifespan) {
        pdf.text(`Vida Útil dos HDs: ${report.data.hdLifespan}`, margin + 5, linePos);
        linePos += 7;
      }
      if (report.data.lastValidBackup) {
        pdf.text(`Último Backup Válido: ${format(new Date(report.data.lastValidBackup), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, margin + 5, linePos);
      }
      yPosition += statusInfoHeight + 15;
    }

    // Updates Block
    if (report.data.updatesApplied) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('ATUALIZAÇÕES APLICADAS', margin, yPosition);
      yPosition += 10;
      
      const updatesBoxStart = yPosition - 5;
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.updatesApplied, margin + 5, yPosition + 5, pageWidth - 2 * margin - 10);
      const updatesBoxHeight = yPosition - updatesBoxStart + 5;
      addSectionBox(margin, updatesBoxStart, pageWidth - 2 * margin, updatesBoxHeight);
      yPosition += 15;
    }

    // Alerts Block
    if (report.data.alertsVulnerabilities) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('ALERTAS/VULNERABILIDADES', margin, yPosition);
      yPosition += 10;
      
      const alertsBoxStart = yPosition - 5;
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.alertsVulnerabilities, margin + 5, yPosition + 5, pageWidth - 2 * margin - 10);
      const alertsBoxHeight = yPosition - alertsBoxStart + 5;
      addSectionBox(margin, alertsBoxStart, pageWidth - 2 * margin, alertsBoxHeight);
      yPosition += 15;
    }
  }

  // Footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pdf.internal.pageSize.height - 10, { align: 'right' });
  }

  // Generate filename and save
  const filename = `${report.title.replace(/\s+/g, '_')}_${format(new Date(report.createdAt), "yyyyMMdd_HHmm")}.pdf`;
  pdf.save(filename);
};