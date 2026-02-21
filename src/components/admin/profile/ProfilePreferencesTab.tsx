import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Volume2, VolumeX, Moon, Sun, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

interface ProfilePreferencesTabProps {
  som?: boolean;
  onSave: (data: { som: boolean }) => Promise<void>;
}

export const ProfilePreferencesTab = ({ som = true, onSave }: ProfilePreferencesTabProps) => {
  const [soundEnabled, setSoundEnabled] = useState(som);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSoundChange = (checked: boolean) => {
    setSoundEnabled(checked);
    setHasChanges(checked !== som);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ som: soundEnabled });
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {theme === 'dark' ? (
              <Moon className="h-5 w-5 text-primary" />
            ) : (
              <Sun className="h-5 w-5 text-primary" />
            )}
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a aparência do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label className="text-base font-medium">Tema Escuro</Label>
                <p className="text-sm text-muted-foreground">
                  Ative para usar o tema escuro
                </p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure suas preferências de notificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="h-5 w-5 text-muted-foreground" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label className="text-base font-medium">Som de Notificações</Label>
                <p className="text-sm text-muted-foreground">
                  Reproduzir som ao receber novas mensagens
                </p>
              </div>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={handleSoundChange}
            />
          </div>

          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end pt-4"
            >
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Preferências
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
