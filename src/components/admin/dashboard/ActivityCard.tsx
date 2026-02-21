
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface ActivityItem {
  icon: React.ElementType;
  title: string;
  time: string;
  color: string;
}

interface ActivityCardProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

const ActivityCard = ({ activities, isLoading = false }: ActivityCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="h-full"
    >
      <Card className="h-full border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
        {/* Header with gradient */}
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white pb-4">
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2">
              <Activity className="h-5 w-5" />
            </div>
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            // Loading placeholders
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {activities.slice(0, 4).map((activity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className="flex items-center gap-4 p-6 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                >
                  {/* Activity icon */}
                  <div className={`${activity.color} rounded-xl p-3 shadow-sm group-hover:shadow-md transition-shadow`}>
                    <activity.icon className="h-5 w-5 text-white" />
                  </div>
                  
                  {/* Activity content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-700">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{activity.time}</span>
                    </div>
                  </div>
                  
                  {/* Arrow indicator */}
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </motion.div>
              ))}
              
              {/* View all button */}
              <div className="p-4 bg-gray-50/50">
                <Button 
                  variant="ghost" 
                  className="w-full text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  Ver todas as atividades
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Nenhuma atividade recente</p>
              <p className="text-sm text-gray-400 mt-1">As atividades aparecerão aqui quando disponíveis</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ActivityCard;
