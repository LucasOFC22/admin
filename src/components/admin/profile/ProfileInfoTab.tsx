import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Building, Briefcase, Calendar, Clock, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDateLong } from '@/utils/dateFormatters';

interface ProfileInfoTabProps {
  profile: {
    nome?: string;
    email?: string;
    telefone?: string;
    empresa?: string;
    cargo?: string;
    data_criacao?: string;
    data_ultima_atividade?: string;
  };
  isLoading: boolean;
  onSave: (data: { nome: string; telefone: string }) => Promise<void>;
}

export const ProfileInfoTab = ({ profile, isLoading, onSave }: ProfileInfoTabProps) => {
  const [nome, setNome] = useState(profile.nome || '');
  const [telefone, setTelefone] = useState(profile.telefone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleNomeChange = (value: string) => {
    setNome(value);
    setHasChanges(value !== profile.nome || telefone !== profile.telefone);
  };

  const handleTelefoneChange = (value: string) => {
    // Máscara de telefone
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = `(${cleaned.slice(0, 2)}`;
      if (cleaned.length >= 3) {
        formatted += `) ${cleaned.slice(2, 7)}`;
        if (cleaned.length >= 8) {
          formatted += `-${cleaned.slice(7, 11)}`;
        }
      }
    }
    setTelefone(formatted);
    setHasChanges(nome !== profile.nome || formatted !== profile.telefone);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ nome, telefone });
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString?: string) => formatDateLong(dateString);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Informações Editáveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Atualize suas informações pessoais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nome Completo
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                placeholder="Seu nome completo"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                value={profile.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Telefone
              </Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => handleTelefoneChange(e.target.value)}
                placeholder="(00) 00000-0000"
                disabled={isLoading}
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Cargo
              </Label>
              <Input
                id="cargo"
                value={profile.cargo || '-'}
                disabled
                className="bg-muted"
              />
            </div>
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
                Salvar Alterações
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Conta criada em</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(profile.data_criacao)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Última atividade</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(profile.data_ultima_atividade)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
