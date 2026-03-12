import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
  MapPin,
  Globe,
  Clock,
  Shield,
  LogOut,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Wifi,
} from 'lucide-react';
import { useActiveDevices, ActiveDevice } from '@/hooks/useActiveDevices';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';

interface ActiveDevicesManagerProps {
  userId: string | undefined;
}

const DeviceTypeIcon = ({ type, className = '' }: { type: string; className?: string }) => {
  switch (type) {
    case 'mobile': return <Smartphone className={`h-5 w-5 ${className}`} />;
    case 'tablet': return <Tablet className={`h-5 w-5 ${className}`} />;
    case 'desktop': return <Monitor className={`h-5 w-5 ${className}`} />;
    default: return <HelpCircle className={`h-5 w-5 ${className}`} />;
  }
};

const LocationDisplay = ({ location, ip }: { location: ActiveDevice['location']; ip: string | null }) => {
  if (location.loading) return <Skeleton className="h-4 w-24" />;
  
  const parts = [location.city, location.region, location.country].filter(Boolean);
  const locationStr = parts.length > 0 ? parts.join(', ') : null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {locationStr ? (
        <>
          <MapPin className="h-3 w-3 shrink-0" />
          <span>{locationStr}</span>
        </>
      ) : ip ? (
        <>
          <Globe className="h-3 w-3 shrink-0" />
          <span className="font-mono">{ip}</span>
        </>
      ) : (
        <span>Localização indisponível</span>
      )}
    </div>
  );
};

const DeviceCard = ({
  device,
  onRevoke,
  isRevoking,
}: {
  device: ActiveDevice;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const lastActive = device.last_used_at
    ? formatDistanceToNow(new Date(device.last_used_at), { addSuffix: true, locale: ptBR })
    : 'Desconhecido';

  const createdAt = device.created_at
    ? format(new Date(device.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={`relative p-4 rounded-xl border transition-colors ${
          device.isCurrentDevice
            ? 'border-primary/40 bg-primary/5'
            : 'border-border bg-card hover:bg-muted/50'
        }`}
      >
        {/* Current device indicator */}
        {device.isCurrentDevice && (
          <div className="absolute -top-2.5 left-4">
            <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0 h-5 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Este dispositivo
            </Badge>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          {/* Device info */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`mt-0.5 p-2.5 rounded-xl shrink-0 ${
              device.isCurrentDevice ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              <DeviceTypeIcon type={device.parsed.deviceType} />
            </div>

            <div className="min-w-0 space-y-1.5">
              {/* Browser + OS */}
              <div>
                <p className="text-sm font-medium truncate">
                  {device.parsed.browser}
                </p>
                <p className="text-xs text-muted-foreground">
                  {device.parsed.os}
                  {device.device_name ? ` • ${device.device_name}` : ''}
                </p>
              </div>

              {/* Location */}
              <LocationDisplay location={device.location} ip={device.ip_address} />

              {/* Last active */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>Último acesso {lastActive}</span>
              </div>

              {/* IP + Created */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground/70">
                {device.ip_address && device.location.city && (
                  <span className="font-mono">IP: {device.ip_address}</span>
                )}
                {createdAt && (
                  <span>Registrado em {createdAt}</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {!device.isCurrentDevice && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
              onClick={() => setShowConfirm(true)}
              disabled={isRevoking}
            >
              {isRevoking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Encerrar</span>
            </Button>
          )}
        </div>

        {/* Online indicator */}
        {device.isCurrentDevice && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-[11px] text-green-600 font-medium">Online</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Confirm dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar sessão neste dispositivo?</AlertDialogTitle>
            <AlertDialogDescription>
              O dispositivo <strong>{device.parsed.browser} ({device.parsed.os})</strong>
              {device.location.city && ` em ${device.location.city}`} será desconectado. 
              O usuário precisará fazer login novamente nesse dispositivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onRevoke(device.id)}
            >
              Encerrar Sessão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const ActiveDevicesManager = ({ userId }: ActiveDevicesManagerProps) => {
  const {
    devices,
    isLoading,
    revokeDevice,
    isRevoking,
    revokeAllOthers,
    isRevokingAll,
    refetch,
  } = useActiveDevices(userId);
  const { notify } = useCustomNotifications();
  const [showRevokeAll, setShowRevokeAll] = useState(false);

  const otherDevices = devices.filter(d => !d.isCurrentDevice);
  const currentDevice = devices.find(d => d.isCurrentDevice);

  const handleRevoke = async (deviceId: string) => {
    try {
      await revokeDevice(deviceId);
      notify.success('Sessão encerrada', 'O dispositivo foi desconectado com sucesso.');
    } catch {
      notify.error('Erro', 'Não foi possível encerrar a sessão.');
    }
  };

  const handleRevokeAll = async () => {
    try {
      await revokeAllOthers();
      setShowRevokeAll(false);
      notify.success('Todas as sessões encerradas', 'Todos os outros dispositivos foram desconectados.');
    } catch {
      notify.error('Erro', 'Não foi possível encerrar as sessões.');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Dispositivos Ativos
              </CardTitle>
              <CardDescription>
                Gerencie os dispositivos conectados à sua conta. {devices.length > 0 && (
                  <span className="font-medium">{devices.length} dispositivo{devices.length !== 1 ? 's' : ''} ativo{devices.length !== 1 ? 's' : ''}</span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
              {otherDevices.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRevokeAll(true)}
                  disabled={isRevokingAll}
                  className="gap-1.5"
                >
                  {isRevokingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Encerrar Todas</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Wifi className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhum dispositivo ativo encontrado</p>
              <p className="text-xs mt-1">Faça login para registrar seu dispositivo</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {/* Current device first */}
                  {currentDevice && (
                    <DeviceCard
                      key={currentDevice.id}
                      device={currentDevice}
                      onRevoke={handleRevoke}
                      isRevoking={isRevoking}
                    />
                  )}

                  {/* Other devices */}
                  {otherDevices.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                        Outros dispositivos ({otherDevices.length})
                      </p>
                      <div className="space-y-3">
                        {otherDevices.map((device) => (
                          <DeviceCard
                            key={device.id}
                            device={device}
                            onRevoke={handleRevoke}
                            isRevoking={isRevoking}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Revoke all dialog */}
      <AlertDialog open={showRevokeAll} onOpenChange={setShowRevokeAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar todas as outras sessões?</AlertDialogTitle>
            <AlertDialogDescription>
              {otherDevices.length} dispositivo{otherDevices.length !== 1 ? 's' : ''} será{otherDevices.length !== 1 ? 'ão' : ''} desconectado{otherDevices.length !== 1 ? 's' : ''}. 
              Apenas este dispositivo permanecerá conectado. Os usuários precisarão fazer login novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRevokeAll}
            >
              {isRevokingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Encerrar Todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
