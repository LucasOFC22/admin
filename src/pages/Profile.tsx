import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Settings, ArrowLeft, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ProfileHeader } from '@/components/admin/profile/ProfileHeader';
import { ProfileInfoTab } from '@/components/admin/profile/ProfileInfoTab';
import { ProfileSecurityTab } from '@/components/admin/profile/ProfileSecurityTab';
import { ProfilePreferencesTab } from '@/components/admin/profile/ProfilePreferencesTab';
import { ActiveDevicesManager } from '@/components/admin/profile/ActiveDevicesManager';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Skeleton } from '@/components/ui/skeleton';

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const { userProfile, isLoading, updateProfile, changePassword } = useUserProfile();

  const handleSaveInfo = async (data: { nome: string; telefone: string }) => {
    await updateProfile(data);
  };

  const handleSavePreferences = async (data: { som: boolean }) => {
    await updateProfile(data);
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    await changePassword(currentPassword, newPassword);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {/* Header do Perfil */}
        <ProfileHeader
          nome={userProfile?.nome || ''}
          email={userProfile?.email || ''}
          tipo={userProfile?.tipo || 'user'}
          ativo={userProfile?.ativo ?? true}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="info" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Informações</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Dispositivos</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Preferências</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="info" className="mt-0">
              <ProfileInfoTab
                profile={{
                  nome: userProfile?.nome,
                  email: userProfile?.email,
                  telefone: userProfile?.telefone,
                  empresa: userProfile?.empresa,
                  cargo: userProfile?.cargo,
                  data_criacao: userProfile?.data_criacao,
                  data_ultima_atividade: userProfile?.data_ultima_atividade
                }}
                isLoading={isLoading}
                onSave={handleSaveInfo}
              />
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <ProfileSecurityTab onChangePassword={handleChangePassword} userId={userProfile?.id} />
            </TabsContent>

            <TabsContent value="devices" className="mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <ActiveDevicesManager userId={userProfile?.id} />
              </motion.div>
            </TabsContent>

            <TabsContent value="preferences" className="mt-0">
              <ProfilePreferencesTab
                som={userProfile?.som}
                onSave={handleSavePreferences}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default Profile;
