
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  change: string;
  index: number;
}

const StatCard = ({ title, value, icon: Icon, color, change, index }: StatCardProps) => {
  const isPositive = !change.startsWith('-');
  
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { 
            type: "spring", 
            stiffness: 100,
            damping: 15,
            delay: index * 0.1
          }
        }
      }}
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      className="group"
    >
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
        
        {/* Top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
        
        <CardContent className="relative p-6">
          {/* Header with icon */}
          <div className="flex items-center justify-between mb-4">
            <div className={`${color} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            
            {/* Change indicator */}
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
              isPositive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {change}
            </div>
          </div>

          {/* Value */}
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
              {value}
            </p>
            <p className="text-sm font-medium text-gray-600">
              {title}
            </p>
            <p className="text-xs text-gray-500">
              em relação ao mês passado
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;
