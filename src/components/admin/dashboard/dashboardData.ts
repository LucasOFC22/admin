
import { Users, Settings, Shield, Truck, Activity, BarChart, FileText, Calendar } from "lucide-react";

// Links de acesso rápido
export const quickAccessLinks = [
  { title: "Usuários", icon: Users, path: "/usuarios" },
  { title: "Cotações", icon: FileText, path: "/cotacoes" },
  { title: "Relatórios", icon: BarChart, path: "/relatorios" },
  { title: "Agenda", icon: Calendar, path: "#" },
];

// Variantes de animação para container
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};

// Map para ícones de estatísticas
export const statsIcons = {
  usuarios: Users,
  cargos: Settings,
  permissoes: Shield,
  veiculos: Truck
};

// Map para cores de estatísticas
export const statsColors = {
  usuarios: "bg-blue-100 text-blue-600",
  cargos: "bg-green-100 text-green-600",
  permissoes: "bg-purple-100 text-purple-600",
  veiculos: "bg-amber-100 text-amber-600"
};

// Map para ícones de atividades
export const activityIcons = {
  users: Users,
  "file-text": FileText,
  shield: Shield,
  activity: Activity
};
