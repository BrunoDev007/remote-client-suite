import { useState } from "react";
import { FileText, Plus, Download, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ReportForm } from "@/components/reports/ReportForm";
import { ReportsList } from "@/components/reports/ReportsList";
import { useToast } from "@/hooks/use-toast";

export interface TechnicalReport {
  id: string;
  type: 'monitoring' | 'periodic' | 'backup';
  title: string;
  data: Record<string, any>;
  createdAt: string;
  status?: string;
  client_id: string;
  client_name: string;
}

export default function TechnicalReports() {
  const [reports, setReports] = useState<TechnicalReport[]>(() => {
    const saved = localStorage.getItem('technical-reports');
    return saved ? JSON.parse(saved) : [];
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<TechnicalReport | null>(null);
  const { toast } = useToast();

  const handleSaveReport = (reportData: Omit<TechnicalReport, 'id' | 'createdAt'>) => {
    if (editingReport) {
      // Update existing report
      const updatedReports = reports.map(report =>
        report.id === editingReport.id
          ? { ...reportData, id: editingReport.id, createdAt: editingReport.createdAt }
          : report
      );
      setReports(updatedReports);
      localStorage.setItem('technical-reports', JSON.stringify(updatedReports));
      
      toast({
        title: "Relatório atualizado",
        description: "O relatório técnico foi atualizado com sucesso.",
      });
    } else {
      // Create new report
      const newReport: TechnicalReport = {
        ...reportData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      const updatedReports = [...reports, newReport];
      setReports(updatedReports);
      localStorage.setItem('technical-reports', JSON.stringify(updatedReports));
      
      toast({
        title: "Relatório salvo",
        description: "O relatório técnico foi salvo com sucesso.",
      });
    }
    
    setIsFormOpen(false);
    setEditingReport(null);
  };

  const handleDeleteReport = (id: string) => {
    const updatedReports = reports.filter(report => report.id !== id);
    setReports(updatedReports);
    localStorage.setItem('technical-reports', JSON.stringify(updatedReports));
    
    toast({
      title: "Relatório excluído",
      description: "O relatório foi excluído com sucesso.",
    });
  };

  const handleEditReport = (report: TechnicalReport) => {
    setEditingReport(report);
    setIsFormOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios Técnicos</h1>
          <p className="text-muted-foreground">
            Gerencie e exporte relatórios técnicos do sistema
          </p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingReport(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-elegant transition-smooth">
              <Plus className="h-4 w-4 mr-2" />
              Gerar Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingReport ? 'Editar Relatório Técnico' : 'Novo Relatório Técnico'}</DialogTitle>
              <DialogDescription>
                Selecione o tipo de relatório e preencha as informações necessárias.
              </DialogDescription>
            </DialogHeader>
            <ReportForm 
              report={editingReport} 
              onSave={handleSaveReport} 
              onCancel={() => {
                setIsFormOpen(false);
                setEditingReport(null);
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Relatórios
            </CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">
              {reports.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="h-4 w-4 mr-1" />
              Relatórios gerados
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Este Mês
            </CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">
              {reports.filter(r => {
                const reportDate = new Date(r.createdAt);
                const now = new Date();
                return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
              }).length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              Relatórios recentes
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <CardDescription className="text-2xl font-bold text-warning">
              {reports.filter(r => r.data.status === 'Pendente' || r.data.status === 'Em andamento').length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Eye className="h-4 w-4 mr-1" />
              Requerem atenção
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <ReportsList 
        reports={reports} 
        onDelete={handleDeleteReport}
        onEdit={handleEditReport}
      />
    </div>
  );
}