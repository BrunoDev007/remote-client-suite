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

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RELATÓRIO TÉCNICO', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  pdf.setFontSize(14);
  pdf.text(report.title, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Gerado em: ${format(new Date(report.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, yPosition);
  
  yPosition += 20;

  // Content based on report type
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);

  if (report.type === 'monitoring') {
    pdf.text('RELATÓRIO DE ACOMPANHAMENTO', margin, yPosition);
    yPosition += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    if (report.data.visitDate) {
      yPosition = addText(`Data da Visita: ${format(new Date(report.data.visitDate), "dd/MM/yyyy", { locale: ptBR })}`, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 5;
    }

    if (report.data.technician) {
      yPosition = addText(`Técnico Responsável: ${report.data.technician}`, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 10;
    }

    if (report.data.problemIdentified) {
      pdf.setFont('helvetica', 'bold');
      yPosition = addText('Problema Identificado:', margin, yPosition, pageWidth - 2 * margin);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.problemIdentified, margin, yPosition + 5, pageWidth - 2 * margin);
      yPosition += 10;
    }

    if (report.data.solutionApplied) {
      pdf.setFont('helvetica', 'bold');
      yPosition = addText('Solução Aplicada:', margin, yPosition, pageWidth - 2 * margin);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.solutionApplied, margin, yPosition + 5, pageWidth - 2 * margin);
      yPosition += 10;
    }

    if (report.data.observations) {
      pdf.setFont('helvetica', 'bold');
      yPosition = addText('Observações:', margin, yPosition, pageWidth - 2 * margin);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.observations, margin, yPosition + 5, pageWidth - 2 * margin);
      yPosition += 10;
    }

    if (report.data.status) {
      yPosition = addText(`Status: ${report.data.status}`, margin, yPosition, pageWidth - 2 * margin);
    }
  }

  if (report.type === 'periodic') {
    pdf.text('RELATÓRIO DE ATIVIDADES PERIÓDICAS', margin, yPosition);
    yPosition += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    if (report.data.subcategory) {
      yPosition = addText(`Subcategoria: ${report.data.subcategory}`, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 5;
    }

    if (report.data.executionDate) {
      yPosition = addText(`Data da Execução: ${format(new Date(report.data.executionDate), "dd/MM/yyyy", { locale: ptBR })}`, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 5;
    }

    if (report.data.equipment) {
      yPosition = addText(`Equipamento: ${report.data.equipment}`, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 10;
    }

    if (report.data.activityPerformed) {
      pdf.setFont('helvetica', 'bold');
      yPosition = addText('Atividade Realizada:', margin, yPosition, pageWidth - 2 * margin);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.activityPerformed, margin, yPosition + 5, pageWidth - 2 * margin);
      yPosition += 10;
    }

    if (report.data.observations) {
      pdf.setFont('helvetica', 'bold');
      yPosition = addText('Observações:', margin, yPosition, pageWidth - 2 * margin);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.observations, margin, yPosition + 5, pageWidth - 2 * margin);
      yPosition += 10;
    }

    if (report.data.result) {
      yPosition = addText(`Resultado: ${report.data.result}`, margin, yPosition, pageWidth - 2 * margin);
    }
  }

  if (report.type === 'backup') {
    pdf.text('RELATÓRIO DE BACKUP E SEGURANÇA', margin, yPosition);
    yPosition += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    if (report.data.backupStatus) {
      yPosition = addText(`Status dos Backups: ${report.data.backupStatus}`, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 5;
    }

    if (report.data.hdLifespan) {
      yPosition = addText(`Vida Útil dos HDs: ${report.data.hdLifespan}`, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 5;
    }

    if (report.data.lastValidBackup) {
      yPosition = addText(`Último Backup Válido: ${format(new Date(report.data.lastValidBackup), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 10;
    }

    if (report.data.updatesApplied) {
      pdf.setFont('helvetica', 'bold');
      yPosition = addText('Atualizações Aplicadas:', margin, yPosition, pageWidth - 2 * margin);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.updatesApplied, margin, yPosition + 5, pageWidth - 2 * margin);
      yPosition += 10;
    }

    if (report.data.alertsVulnerabilities) {
      pdf.setFont('helvetica', 'bold');
      yPosition = addText('Alertas/Vulnerabilidades:', margin, yPosition, pageWidth - 2 * margin);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(report.data.alertsVulnerabilities, margin, yPosition + 5, pageWidth - 2 * margin);
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