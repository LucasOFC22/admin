import { useState, useEffect, useCallback } from 'react';
import { Clock, Save, Plus, Trash2, Info, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/lib/toast';
import { businessHoursService, BusinessHoursConfig, DaySchedule, DayStatus, Holiday, ScheduleType } from '@/services/supabase/businessHoursService';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

interface FilaOption {
  id: number;
  name: string;
  color: string;
}

export function WhatsAppBusinessHoursConfig() {
  const [config, setConfig] = useState<BusinessHoursConfig | null>(null);
  const [filas, setFilas] = useState<FilaOption[]>([]);
  const [selectedFilaId, setSelectedFilaId] = useState<number | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHolidayDialog, setShowHolidayDialog] = useState(false);
  const [newHoliday, setNewHoliday] = useState<Omit<Holiday, 'id' | 'created_at'>>({
    date: '', name: '', start_time: '', end_time: '', message: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configData, holidaysData] = await Promise.all([
        businessHoursService.getConfig(selectedFilaId),
        businessHoursService.getHolidays(),
      ]);
      setConfig(configData);
      setHolidays(holidaysData);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar configurações de horário');
    } finally {
      setLoading(false);
    }
  }, [selectedFilaId]);

  useEffect(() => {
    const loadFilas = async () => {
      try {
        const supabase = requireAuthenticatedClient();
        const { data } = await supabase
          .from('filas_whatsapp')
          .select('id, name, color')
          .eq('active', true)
          .order('name');
        setFilas(data || []);
      } catch (e) {
        console.error('Erro ao carregar filas:', e);
      }
    };
    loadFilas();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleScheduleTypeChange = (type: ScheduleType) => {
    if (!config) return;
    setConfig({ ...config, schedule_type: type });
    if (type === 'empresa') {
      setSelectedFilaId(null);
    }
  };

  const handleDayChange = (dayIndex: number, field: keyof DaySchedule, value: string) => {
    if (!config) return;
    const newDays = [...config.days];
    (newDays[dayIndex] as any)[field] = value;
    setConfig({ ...config, days: newDays });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await businessHoursService.saveConfig(config);
      toast.success('Horários salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar horários');
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      toast.error('Preencha a data e o nome do feriado');
      return;
    }
    try {
      await businessHoursService.createHoliday({
        date: newHoliday.date,
        name: newHoliday.name,
        start_time: newHoliday.start_time || null,
        end_time: newHoliday.end_time || null,
        message: newHoliday.message || null,
      });
      toast.success('Feriado adicionado!');
      setShowHolidayDialog(false);
      setNewHoliday({ date: '', name: '', start_time: '', end_time: '', message: '' });
      loadData();
    } catch (error) {
      toast.error('Erro ao adicionar feriado');
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    try {
      await businessHoursService.deleteHoliday(id);
      toast.success('Feriado removido!');
      loadData();
    } catch {
      toast.error('Erro ao remover feriado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-foreground">Horário de Atendimento</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure os horários em que o atendimento WhatsApp está disponível
        </p>
      </div>

      <Tabs defaultValue="horario" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-card h-auto p-0">
          <TabsTrigger
            value="horario"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Horário comercial
          </TabsTrigger>
          <TabsTrigger
            value="feriados"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Feriados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="horario" className="mt-0 p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Horário comercial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info Card */}
              <div className="rounded-md border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm text-foreground">Tipos de horários</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Aberto:</strong> O estabelecimento está aberto o dia todo.
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Fechado:</strong> O estabelecimento está fechado durante todo o dia.
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Horário:</strong> Representa o horário de funcionamento.
                </p>
                <Separator className="bg-primary/10" />
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm text-foreground">Informações importantes</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  🏢 <strong className="text-foreground">Por empresa:</strong> Define o horário geral para toda a empresa.
                </p>
                <p className="text-xs text-muted-foreground">
                  🔀 <strong className="text-foreground">Por fila:</strong> Define horários específicos para cada fila.
                </p>
                <p className="text-xs text-muted-foreground font-semibold">
                  Atenção: Ao selecionar uma opção, as outras serão desativadas.
                </p>
                <p className="text-xs text-muted-foreground">
                  ⚠️ <strong className="text-foreground">Atendimentos em andamento:</strong> O horário só é verificado ao criar <strong>novos</strong> chats. Atendimentos já em curso não são interrompidos.
                </p>
              </div>

              {/* Schedule Type */}
              <RadioGroup
                value={config?.schedule_type || 'empresa'}
                onValueChange={(v) => handleScheduleTypeChange(v as ScheduleType)}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="empresa" id="company" />
                  <Label htmlFor="company">Cronograma por empresa</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="fila" id="queue" />
                  <Label htmlFor="queue">Agendamento por fila</Label>
                </div>
              </RadioGroup>

              {/* Queue Selector */}
              {config?.schedule_type === 'fila' && (
                <div className="flex flex-wrap gap-2">
                  {filas.map((fila) => (
                    <button
                      key={fila.id}
                      type="button"
                      onClick={() => setSelectedFilaId(fila.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors border",
                        selectedFilaId === fila.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted hover:bg-muted/80 text-foreground border-border"
                      )}
                    >
                      {fila.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Days Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
                {DAY_NAMES.map((dayName, index) => {
                  const day = config?.days[index];
                  if (!day) return null;
                  return (
                    <Card key={index} className="overflow-hidden">
                      <div className="bg-muted px-3 py-2 font-semibold text-sm text-foreground">
                        {dayName}
                      </div>
                      <Separator />
                      <div className="p-3 space-y-3">
                        <RadioGroup
                          value={day.status}
                          onValueChange={(v) => handleDayChange(index, 'status', v)}
                          className="flex flex-wrap justify-between border rounded-md p-2 gap-1"
                        >
                          <div className="flex items-center gap-1">
                            <RadioGroupItem value="open" id={`${config?.schedule_type}-${selectedFilaId || 'e'}-${index}-open`} />
                            <Label htmlFor={`${config?.schedule_type}-${selectedFilaId || 'e'}-${index}-open`} className="text-xs">Abrir</Label>
                          </div>
                          <div className="flex items-center gap-1">
                            <RadioGroupItem value="closed" id={`${config?.schedule_type}-${selectedFilaId || 'e'}-${index}-closed`} />
                            <Label htmlFor={`${config?.schedule_type}-${selectedFilaId || 'e'}-${index}-closed`} className="text-xs">Fechado</Label>
                          </div>
                          <div className="flex items-center gap-1">
                            <RadioGroupItem value="hours" id={`${config?.schedule_type}-${selectedFilaId || 'e'}-${index}-hours`} />
                            <Label htmlFor={`${config?.schedule_type}-${selectedFilaId || 'e'}-${index}-hours`} className="text-xs">Horas</Label>
                          </div>
                        </RadioGroup>

                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="time"
                            className="h-8 text-xs min-w-0 flex-1"
                            disabled={day.status !== 'hours'}
                            value={day.start1}
                            onChange={(e) => handleDayChange(index, 'start1', e.target.value)}
                          />
                          <span className="text-xs text-muted-foreground">para</span>
                          <Input
                            type="time"
                            className="h-8 text-xs min-w-0 flex-1"
                            disabled={day.status !== 'hours'}
                            value={day.end1}
                            onChange={(e) => handleDayChange(index, 'end1', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="time"
                            className="h-8 text-xs min-w-0 flex-1"
                            disabled={day.status !== 'hours'}
                            value={day.start2}
                            onChange={(e) => handleDayChange(index, 'start2', e.target.value)}
                          />
                          <span className="text-xs text-muted-foreground">para</span>
                          <Input
                            type="time"
                            className="h-8 text-xs min-w-0 flex-1"
                            disabled={day.status !== 'hours'}
                            value={day.end2}
                            onChange={(e) => handleDayChange(index, 'end2', e.target.value)}
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-1">
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar horários'}
              </Button>
            </CardFooter>
          </Card>

          {/* Absence Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mensagem de Ausência</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config?.absence_message || ''}
                onChange={(e) => config && setConfig({ ...config, absence_message: e.target.value })}
                placeholder="Digite a mensagem que será enviada fora do horário de atendimento"
                className="min-h-[80px]"
              />
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-1">
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="feriados" className="mt-0 p-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Feriados</CardTitle>
              <Button size="sm" onClick={() => setShowHolidayDialog(true)} className="gap-1">
                <Plus className="h-4 w-4" />
                Novo feriado
              </Button>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum feriado cadastrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {holidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{holiday.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(holiday.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {holiday.start_time && holiday.end_time && (
                          <p className="text-xs text-muted-foreground">
                            {holiday.start_time} - {holiday.end_time}
                          </p>
                        )}
                        {holiday.message && (
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                            {holiday.message}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => holiday.id && handleDeleteHoliday(holiday.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Holiday Dialog */}
      <Dialog open={showHolidayDialog} onOpenChange={setShowHolidayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo feriado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Natal"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Início (opcional)</Label>
                <Input
                  type="time"
                  value={newHoliday.start_time || ''}
                  onChange={(e) => setNewHoliday({ ...newHoliday, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Fim (opcional)</Label>
                <Input
                  type="time"
                  value={newHoliday.end_time || ''}
                  onChange={(e) => setNewHoliday({ ...newHoliday, end_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Mensagem enviada neste feriado"
                value={newHoliday.message || ''}
                onChange={(e) => setNewHoliday({ ...newHoliday, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHolidayDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddHoliday} disabled={!newHoliday.date || !newHoliday.name}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
