import { useState } from 'react';
import { User, Mail, Phone, Building, Save, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

const ProfileTab = () => {
  const { user, signOut } = useUnifiedAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    empresa: user?.empresa || '',
    password: ''
  });

  const handleSave = () => {
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram salvas com sucesso."
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      nome: user?.nome || '',
      email: user?.email || '',
      telefone: user?.telefone || '',
      empresa: user?.empresa || '',
      password: ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">Usuário não autenticado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Meu Perfil
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant={user.ativo ? "default" : "secondary"}>
                {user.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
              <Badge variant="outline">
                {user.tipo === 'admin' ? 'Administrador' : 'Cliente'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="empresa">Empresa</Label>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <Input
                    id="empresa"
                    value={formData.empresa}
                    onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div>
                <Label htmlFor="password">Nova Senha (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Digite nova senha"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Editar Perfil
                </Button>
              )}
              <Button variant="destructive" onClick={signOut}>
                Sair
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;
