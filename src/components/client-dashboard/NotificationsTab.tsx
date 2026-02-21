
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const NotificationsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
        <CardDescription>
          Atualizações sobre seus serviços
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center py-10">
        <p className="text-gray-500">Você não possui novas notificações</p>
      </CardContent>
    </Card>
  );
};

export default NotificationsTab;
