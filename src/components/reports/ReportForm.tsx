import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TechnicalReport } from "@/pages/TechnicalReports";

const baseSchema = z.object({
  type: z.enum(['monitoring', 'periodic', 'backup']),
});

const monitoringSchema = baseSchema.extend({
  visitDate: z.string().min(1, "Data da visita é obrigatória"),
  technician: z.string().min(1, "Técnico responsável é obrigatório"),
  problemIdentified: z.string().min(1, "Problema identificado é obrigatório"),
  solutionApplied: z.string().min(1, "Solução aplicada é obrigatória"),
  observations: z.string().optional(),
  status: z.enum(['Resolvido', 'Pendente', 'Em andamento']),
});

const periodicSchema = baseSchema.extend({
  subcategory: z.enum(['Preventivas', 'Corretivas']),
  executionDate: z.string().min(1, "Data da execução é obrigatória"),
  equipment: z.string().min(1, "Equipamento é obrigatório"),
  activityPerformed: z.string().min(1, "Atividade realizada é obrigatória").max(800, "Máximo 800 caracteres"),
  observations: z.string().optional(),
  result: z.enum(['OK', 'Requer atenção']),
});

const backupSchema = baseSchema.extend({
  backupStatus: z.enum(['Bem-sucedidos', 'Falhos', 'Pendentes']),
  hdLifespan: z.enum(['Bom', 'Alerta', 'Crítico']),
  lastValidBackup: z.string().min(1, "Data e hora do último backup é obrigatória"),
  updatesApplied: z.string().optional(),
  alertsVulnerabilities: z.string().optional(),
});

type FormData = z.infer<typeof monitoringSchema> | z.infer<typeof periodicSchema> | z.infer<typeof backupSchema>;

interface ReportFormProps {
  onSave: (report: Omit<TechnicalReport, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function ReportForm({ onSave, onCancel }: ReportFormProps) {
  const [reportType, setReportType] = useState<'monitoring' | 'periodic' | 'backup' | ''>('');

  const getSchema = () => {
    switch (reportType) {
      case 'monitoring': return monitoringSchema;
      case 'periodic': return periodicSchema;
      case 'backup': return backupSchema;
      default: return baseSchema;
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      type: '' as any,
    },
  });

  const handleTypeChange = (type: 'monitoring' | 'periodic' | 'backup') => {
    setReportType(type);
    form.setValue('type', type);
    form.trigger();
  };

  const onSubmit = (data: FormData) => {
    const reportTitle = getReportTitle(data.type);
    
    onSave({
      type: data.type,
      title: reportTitle,
      data,
      status: 'status' in data ? data.status : undefined,
    });
  };

  const getReportTitle = (type: string) => {
    switch (type) {
      case 'monitoring': return 'Relatório de Acompanhamento';
      case 'periodic': return 'Relatório de Atividades Periódicas';
      case 'backup': return 'Relatório de Backup e Segurança';
      default: return 'Relatório Técnico';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Relatório</CardTitle>
            <CardDescription>Selecione o tipo de relatório que deseja gerar</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Relatório</FormLabel>
                  <Select onValueChange={handleTypeChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de relatório" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monitoring">Relatório de Acompanhamento</SelectItem>
                      <SelectItem value="periodic">Relatório de Atividades Periódicas</SelectItem>
                      <SelectItem value="backup">Relatório de Backup e Segurança</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {reportType === 'monitoring' && <MonitoringForm form={form} />}
        {reportType === 'periodic' && <PeriodicForm form={form} />}
        {reportType === 'backup' && <BackupForm form={form} />}

        {reportType && (
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-gradient-primary text-primary-foreground">
              Salvar Relatório
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

function MonitoringForm({ form }: { form: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Acompanhamento</CardTitle>
        <CardDescription>Preencha os detalhes do acompanhamento técnico</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="visitDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Visita</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="technician"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Técnico Responsável</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do técnico" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="problemIdentified"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problema Identificado</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva o problema identificado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="solutionApplied"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Solução Aplicada</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva a solução aplicada" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Observações adicionais" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Resolvido">Resolvido</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

function PeriodicForm({ form }: { form: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Atividades Periódicas</CardTitle>
        <CardDescription>Registre as atividades periódicas realizadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="subcategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a subcategoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Preventivas">Preventivas</SelectItem>
                    <SelectItem value="Corretivas">Corretivas</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="executionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Execução</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="equipment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipamento</FormLabel>
              <FormControl>
                <Input placeholder="Nome/identificação do equipamento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="activityPerformed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atividade Realizada (máx. 800 caracteres)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva detalhadamente a atividade realizada"
                  maxLength={800}
                  {...field} 
                />
              </FormControl>
              <div className="text-sm text-muted-foreground text-right">
                {field.value?.length || 0}/800
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ex.: disco próximo de encher, necessidade de upgrade, alertas de antivírus"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="result"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resultado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o resultado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="OK">OK</SelectItem>
                  <SelectItem value="Requer atenção">Requer atenção</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

function BackupForm({ form }: { form: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Backup e Segurança</CardTitle>
        <CardDescription>Registre o status dos backups e segurança do sistema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="backupStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status dos Backups</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Bem-sucedidos">Bem-sucedidos</SelectItem>
                    <SelectItem value="Falhos">Falhos</SelectItem>
                    <SelectItem value="Pendentes">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hdLifespan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vida Útil dos HDs</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Bom">Bom</SelectItem>
                    <SelectItem value="Alerta">Alerta</SelectItem>
                    <SelectItem value="Crítico">Crítico</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="lastValidBackup"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data e Hora do Último Backup Válido</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="updatesApplied"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atualizações Aplicadas</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva as atualizações aplicadas: sistemas, antivírus, firewall, etc."
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="alertsVulnerabilities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alertas ou Vulnerabilidades Encontradas</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva alertas de segurança ou vulnerabilidades identificadas"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}