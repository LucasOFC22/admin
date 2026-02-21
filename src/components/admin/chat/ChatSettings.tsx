
import React, { useState } from 'react';
import { Settings, Save, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const ChatSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    enabled: true,
    welcomeMessage: 'Olá! Como posso ajudá-lo hoje?',
    autoReply: false,
    maxMessages: '100',
    retentionDays: '30'
  });

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações do chat foram atualizadas."
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Configurações do Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Chat Habilitado</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar ou desativar o sistema de chat
                </p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            <div>
              <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
              <Textarea
                id="welcomeMessage"
                value={settings.welcomeMessage}
                onChange={(e) => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                placeholder="Mensagem exibida ao iniciar o chat"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Resposta Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar mensagem automática quando offline
                </p>
              </div>
              <Switch
                checked={settings.autoReply}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, autoReply: checked }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxMessages">Máximo de Mensagens</Label>
                <Input
                  id="maxMessages"
                  value={settings.maxMessages}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxMessages: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="retentionDays">Retenção (dias)</Label>
                <Input
                  id="retentionDays"
                  value={settings.retentionDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, retentionDays: e.target.value }))}
                />
              </div>
            </div>

            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatSettings;
