import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TechnicalReport } from "@/pages/TechnicalReports";
import { useClients } from "@/hooks/useClients";
import { useProfiles } from "@/hooks/useProfiles";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface ReportFormProps {
  report?: TechnicalReport | null;
  onSave: (report: Omit<TechnicalReport, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function ReportForm({ report, onSave, onCancel }: ReportFormProps) {
  const [reportType, setReportType] = useState<'monitoring' | 'periodic' | 'backup' | 'service' | ''>('');
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { clients, loading } = useClients();
  const { profiles, loading: profilesLoading } = useProfiles();

  // Initialize form with existing report data
  useEffect(() => {
    if (report) {
      setReportType(report.type);
      setTitle(report.title);
      setClientId(report.client_id);
      setFormData(report.data);
    } else {
      setReportType('');
      setTitle('');
      setClientId('');
      setFormData({});
    }
  }, [report]);

  const handleSubmit = () => {
    if (!reportType || !title || !clientId) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const selectedClient = clients.find(c => c.id === clientId);
    const reportData = {
      type: reportType,
      title,
      client_id: clientId,
      client_name: selectedClient?.company_name || selectedClient?.fantasy_name || selectedClient?.name || '',
      data: formData,
      status: formData.status
    };

    onSave(reportData);
  };

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Selecione o tipo de relatório e cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Tipo de Relatório *</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monitoring">Relatório de Acompanhamento</SelectItem>
                  <SelectItem value="periodic">Relatório de Atividades Periódicas</SelectItem>
                  <SelectItem value="backup">Relatório de Backup e Segurança</SelectItem>
                  <SelectItem value="service">Relatório Técnico de Atendimentos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select value={clientId} onValueChange={setClientId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name || client.fantasy_name || client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título do Relatório *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título do relatório"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {reportType === 'monitoring' && <MonitoringForm formData={formData} updateField={updateFormField} />}
      {reportType === 'periodic' && <PeriodicForm formData={formData} updateField={updateFormField} />}
      {reportType === 'backup' && <BackupForm formData={formData} updateField={updateFormField} />}
      {reportType === 'service' && (
        <ServiceReportForm 
          formData={formData} 
          updateField={updateFormField} 
          profiles={profiles}
          profilesLoading={profilesLoading}
          clients={clients}
          selectedClientId={clientId}
        />
      )}

      {reportType && (
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-gradient-primary text-primary-foreground">
            {report ? 'Atualizar Relatório' : 'Salvar Relatório'}
          </Button>
        </div>
      )}
    </div>
  );
}

interface ServiceReportFormProps {
  formData: Record<string, any>;
  updateField: (field: string, value: any) => void;
  profiles: { id: string; name: string }[];
  profilesLoading: boolean;
  clients: { id: string; name: string; company_name?: string | null; fantasy_name?: string | null }[];
  selectedClientId: string;
}

function ServiceReportForm({ formData, updateField, profiles, profilesLoading, clients, selectedClientId }: ServiceReportFormProps) {
  // Auto-fill client name for signature when client is selected
  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        const clientName = client.company_name || client.fantasy_name || client.name;
        updateField('clientSignatureName', clientName);
      }
    }
  }, [selectedClientId, clients]);

  // Auto-fill technician name for signature when technician is selected
  useEffect(() => {
    if (formData.technicianId) {
      const profile = profiles.find(p => p.id === formData.technicianId);
      if (profile) {
        updateField('technicianName', profile.name);
        updateField('technicianSignatureName', profile.name);
      }
    }
  }, [formData.technicianId, profiles]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Atendimento</CardTitle>
          <CardDescription>Preencha os dados do atendimento técnico</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Pedido *</Label>
              <Input
                id="orderNumber"
                placeholder="Ex: OS-2026-001"
                value={formData.orderNumber || ''}
                onChange={(e) => updateField('orderNumber', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technician">Técnico Responsável *</Label>
              <Select 
                value={formData.technicianId || ''} 
                onValueChange={(value) => updateField('technicianId', value)}
                disabled={profilesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o técnico" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodStart">Período De *</Label>
              <Input
                id="periodStart"
                type="date"
                value={formData.periodStart || ''}
                onChange={(e) => updateField('periodStart', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodEnd">Período Até *</Label>
              <Input
                id="periodEnd"
                type="date"
                value={formData.periodEnd || ''}
                onChange={(e) => updateField('periodEnd', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Descrição Técnica</CardTitle>
          <CardDescription>Descreva detalhadamente o atendimento realizado</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={formData.technicalDescription || ''}
            onChange={(value) => updateField('technicalDescription', value)}
            placeholder="Descreva o atendimento técnico..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assinaturas</CardTitle>
          <CardDescription>Nomes para as assinaturas do relatório</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="technicianSignature">Nome do Técnico para Assinatura</Label>
              <Input
                id="technicianSignature"
                value={formData.technicianSignatureName || ''}
                onChange={(e) => updateField('technicianSignatureName', e.target.value)}
                placeholder="Nome do técnico"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSignature">Nome do Cliente para Assinatura</Label>
              <Input
                id="clientSignature"
                value={formData.clientSignatureName || ''}
                onChange={(e) => updateField('clientSignatureName', e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MonitoringForm({ formData, updateField }: { formData: Record<string, any>, updateField: (field: string, value: any) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Acompanhamento</CardTitle>
        <CardDescription>Preencha os detalhes do acompanhamento técnico</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="visitDate">Data da Visita *</Label>
            <Input
              id="visitDate"
              type="date"
              value={formData.visitDate || ''}
              onChange={(e) => updateField('visitDate', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="technician">Técnico Responsável *</Label>
            <Input
              id="technician"
              placeholder="Nome do técnico"
              value={formData.technician || ''}
              onChange={(e) => updateField('technician', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="problemIdentified">Problema Identificado *</Label>
          <Textarea
            id="problemIdentified"
            placeholder="Descreva o problema identificado"
            value={formData.problemIdentified || ''}
            onChange={(e) => updateField('problemIdentified', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="solutionApplied">Solução Aplicada *</Label>
          <Textarea
            id="solutionApplied"
            placeholder="Descreva a solução aplicada"
            value={formData.solutionApplied || ''}
            onChange={(e) => updateField('solutionApplied', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observations">Observações (Opcional)</Label>
          <Textarea
            id="observations"
            placeholder="Observações adicionais"
            value={formData.observations || ''}
            onChange={(e) => updateField('observations', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={formData.status || ''} onValueChange={(value) => updateField('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Resolvido">Resolvido</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Em andamento">Em andamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function PeriodicForm({ formData, updateField }: { formData: Record<string, any>, updateField: (field: string, value: any) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Atividades Periódicas</CardTitle>
        <CardDescription>Registre as atividades periódicas realizadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategoria *</Label>
            <Select value={formData.subcategory || ''} onValueChange={(value) => updateField('subcategory', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a subcategoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Preventivas">Preventivas</SelectItem>
                <SelectItem value="Corretivas">Corretivas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="executionDate">Data da Execução *</Label>
            <Input
              id="executionDate"
              type="date"
              value={formData.executionDate || ''}
              onChange={(e) => updateField('executionDate', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="equipment">Equipamento *</Label>
          <Input
            id="equipment"
            placeholder="Nome/identificação do equipamento"
            value={formData.equipment || ''}
            onChange={(e) => updateField('equipment', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="activityPerformed">Atividade Realizada (máx. 800 caracteres) *</Label>
          <Textarea
            id="activityPerformed"
            placeholder="Descreva detalhadamente a atividade realizada"
            maxLength={800}
            value={formData.activityPerformed || ''}
            onChange={(e) => updateField('activityPerformed', e.target.value)}
          />
          <div className="text-sm text-muted-foreground text-right">
            {(formData.activityPerformed || '').length}/800
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observations">Observações</Label>
          <Textarea
            id="observations"
            placeholder="Ex.: disco próximo de encher, necessidade de upgrade, alertas de antivírus"
            value={formData.observations || ''}
            onChange={(e) => updateField('observations', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="result">Resultado *</Label>
          <Select value={formData.result || ''} onValueChange={(value) => updateField('result', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o resultado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OK">OK</SelectItem>
              <SelectItem value="Requer atenção">Requer atenção</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function BackupForm({ formData, updateField }: { formData: Record<string, any>, updateField: (field: string, value: any) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Backup e Segurança</CardTitle>
        <CardDescription>Registre o status dos backups e segurança do sistema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="backupStatus">Status dos Backups *</Label>
            <Select value={formData.backupStatus || ''} onValueChange={(value) => updateField('backupStatus', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bem-sucedidos">Bem-sucedidos</SelectItem>
                <SelectItem value="Falhos">Falhos</SelectItem>
                <SelectItem value="Pendentes">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hdLifespan">Vida Útil dos HDs *</Label>
            <Select value={formData.hdLifespan || ''} onValueChange={(value) => updateField('hdLifespan', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bom">Bom</SelectItem>
                <SelectItem value="Alerta">Alerta</SelectItem>
                <SelectItem value="Crítico">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastValidBackup">Data e Hora do Último Backup Válido *</Label>
          <Input
            id="lastValidBackup"
            type="datetime-local"
            value={formData.lastValidBackup || ''}
            onChange={(e) => updateField('lastValidBackup', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="updatesApplied">Atualizações Aplicadas</Label>
          <Textarea
            id="updatesApplied"
            placeholder="Descreva as atualizações aplicadas: sistemas, antivírus, firewall, etc."
            value={formData.updatesApplied || ''}
            onChange={(e) => updateField('updatesApplied', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="alertsVulnerabilities">Alertas ou Vulnerabilidades Encontradas</Label>
          <Textarea
            id="alertsVulnerabilities"
            placeholder="Descreva alertas de segurança ou vulnerabilidades identificadas"
            value={formData.alertsVulnerabilities || ''}
            onChange={(e) => updateField('alertsVulnerabilities', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}