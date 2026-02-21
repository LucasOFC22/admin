import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, Shield, User, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileHeaderProps {
  nome: string;
  email: string;
  tipo: string;
  ativo: boolean;
  avatarUrl?: string;
  onAvatarClick?: () => void;
}

export const ProfileHeader = ({
  nome,
  email,
  tipo,
  ativo,
  avatarUrl,
  onAvatarClick
}: ProfileHeaderProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'admin':
        return 'Administrador';
      case 'cliente':
        return 'Cliente';
      default:
        return 'Usuário';
    }
  };

  const getTipoVariant = (tipo: string) => {
    switch (tipo) {
      case 'admin':
        return 'default';
      case 'cliente':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-40 h-40 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-primary/50 rounded-full blur-3xl" />
      </div>

      <div className="relative p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300" />
            <Avatar className="relative h-28 w-28 border-4 border-background shadow-xl">
              <AvatarImage src={avatarUrl} alt={nome} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {getInitials(nome || 'U')}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 h-9 w-9 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onAvatarClick}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              {nome || 'Usuário'}
            </h1>
            <p className="text-muted-foreground mb-3">{email}</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge variant={getTipoVariant(tipo)} className="gap-1">
                {tipo === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {getTipoLabel(tipo)}
              </Badge>
              
              {ativo ? (
                <Badge variant="outline" className="gap-1 border-green-500/50 text-green-600 bg-green-500/10">
                  <CheckCircle className="h-3 w-3" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 border-red-500/50 text-red-600 bg-red-500/10">
                  Inativo
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
