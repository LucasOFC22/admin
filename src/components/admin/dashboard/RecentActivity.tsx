
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'contact',
      description: 'Novo contato recebido de João Silva',
      time: new Date(Date.now() - 10 * 60 * 1000),
      status: 'new'
    },
    {
      id: 2,
      type: 'quote',
      description: 'Cotação #1234 foi aprovada pelo cliente',
      time: new Date(Date.now() - 30 * 60 * 1000),
      status: 'approved'
    },
    {
      id: 3,
      type: 'chat',
      description: 'Nova mensagem no chat de suporte',
      time: new Date(Date.now() - 45 * 60 * 1000),
      status: 'pending'
    },
    {
      id: 4,
      type: 'quote',
      description: 'Cotação #1235 foi enviada para Maria Santos',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'sent'
    },
    {
      id: 5,
      type: 'contact',
      description: 'Contato atualizado: Pedro Oliveira',
      time: new Date(Date.now() - 3 * 60 * 60 * 1000),
      status: 'updated'
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      new: { variant: 'default' as const, text: 'Novo' },
      approved: { variant: 'default' as const, text: 'Aprovado' },
      pending: { variant: 'secondary' as const, text: 'Pendente' },
      sent: { variant: 'outline' as const, text: 'Enviado' },
      updated: { variant: 'secondary' as const, text: 'Atualizado' }
    };

    const config = variants[status as keyof typeof variants] || variants.new;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(activity.time, { 
                    addSuffix: true,
                    locale: ptBR 
                  })}
                </p>
              </div>
              <div className="ml-4">
                {getStatusBadge(activity.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
