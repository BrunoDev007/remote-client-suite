import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Download, Trash2, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { TechnicalReport } from "@/pages/TechnicalReports";
import { generatePDF } from "@/utils/pdfGenerator";

interface ReportsListProps {
  reports: TechnicalReport[];
  onDelete: (id: string) => void;
}

export function ReportsList({ reports, onDelete }: ReportsListProps) {
  const [selectedReport, setSelectedReport] = useState<TechnicalReport | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'monitoring': return 'Acompanhamento';
      case 'periodic': return 'Atividades Periódicas';
      case 'backup': return 'Backup e Segurança';
      default: return 'Técnico';
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case 'Resolvido':
        return <Badge variant="default" className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" />{status}</Badge>;
      case 'Pendente':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />{status}</Badge>;
      case 'Em andamento':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewReport = (report: TechnicalReport) => {
    setSelectedReport(report);
    setIsViewDialogOpen(true);
  };

  const handleDownloadPDF = async (report: TechnicalReport) => {
    try {
      await generatePDF(report);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  if (reports.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-xl mb-2">Nenhum relatório encontrado</CardTitle>
          <CardDescription className="text-center max-w-md">
            Comece criando seu primeiro relatório técnico usando o botão "Gerar Novo Relatório" acima.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Relatórios Salvos</h2>
      
      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="shadow-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <Badge variant="outline">{getReportTypeLabel(report.type)}</Badge>
                  </div>
                  <CardDescription>
                    Criado em {format(new Date(report.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </CardDescription>
                  {report.status && (
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.status)}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewReport(report)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPDF(report)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Relatório</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(report.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* View Report Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              {selectedReport && format(new Date(selectedReport.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <ReportDetails report={selectedReport} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportDetails({ report }: { report: TechnicalReport }) {
  const renderField = (label: string, value: any) => {
    if (!value) return null;
    
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="text-sm text-foreground p-2 bg-muted rounded-md">
          {value}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes do Relatório</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.type === 'monitoring' && (
          <>
            {renderField("Data da Visita", report.data.visitDate ? format(new Date(report.data.visitDate), "dd/MM/yyyy", { locale: ptBR }) : null)}
            {renderField("Técnico Responsável", report.data.technician)}
            {renderField("Problema Identificado", report.data.problemIdentified)}
            {renderField("Solução Aplicada", report.data.solutionApplied)}
            {renderField("Observações", report.data.observations)}
            {renderField("Status", report.data.status)}
          </>
        )}

        {report.type === 'periodic' && (
          <>
            {renderField("Subcategoria", report.data.subcategory)}
            {renderField("Data da Execução", report.data.executionDate ? format(new Date(report.data.executionDate), "dd/MM/yyyy", { locale: ptBR }) : null)}
            {renderField("Equipamento", report.data.equipment)}
            {renderField("Atividade Realizada", report.data.activityPerformed)}
            {renderField("Observações", report.data.observations)}
            {renderField("Resultado", report.data.result)}
          </>
        )}

        {report.type === 'backup' && (
          <>
            {renderField("Status dos Backups", report.data.backupStatus)}
            {renderField("Vida Útil dos HDs", report.data.hdLifespan)}
            {renderField("Último Backup Válido", report.data.lastValidBackup ? format(new Date(report.data.lastValidBackup), "dd/MM/yyyy HH:mm", { locale: ptBR }) : null)}
            {renderField("Atualizações Aplicadas", report.data.updatesApplied)}
            {renderField("Alertas/Vulnerabilidades", report.data.alertsVulnerabilities)}
          </>
        )}
      </CardContent>
    </Card>
  );
}