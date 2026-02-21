import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Eye, EyeOff, Save, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { SessionHistory } from './SessionHistory';

interface ProfileSecurityTabProps {
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  userId?: string;
}

export const ProfileSecurityTab = ({ onChangePassword, userId }: ProfileSecurityTabProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/) || password.match(/[^a-zA-Z0-9]/)) strength += 25;
    return strength;
  };

  const getStrengthLabel = (strength: number) => {
    if (strength <= 25) return { label: 'Fraca', color: 'bg-red-500' };
    if (strength <= 50) return { label: 'Razoável', color: 'bg-orange-500' };
    if (strength <= 75) return { label: 'Boa', color: 'bg-yellow-500' };
    return { label: 'Forte', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthInfo = getStrengthLabel(passwordStrength);

  const handleSave = async () => {
    setError('');

    if (!currentPassword) {
      setError('Digite sua senha atual');
      return;
    }

    if (newPassword.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsSaving(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Erro ao alterar senha. Verifique sua senha atual.');
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = currentPassword && newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-primary" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Atualize sua senha para manter sua conta segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Senha Atual */}
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha Atual</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* Nova Senha */}
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite sua nova senha"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            {/* Indicador de força */}
            {newPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Força da senha</span>
                  <span className={`font-medium ${
                    passwordStrength <= 25 ? 'text-red-500' :
                    passwordStrength <= 50 ? 'text-orange-500' :
                    passwordStrength <= 75 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {strengthInfo.label}
                  </span>
                </div>
                <Progress value={passwordStrength} className="h-1.5" />
              </motion.div>
            )}
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                As senhas não coincidem
              </p>
            )}

            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Senhas coincidem
              </p>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              {error}
            </motion.div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={!canSave || isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Alterar Senha
            </Button>
          </div>
        </CardContent>
      </Card>

      <SessionHistory userId={userId} />
    </motion.div>
  );
};
