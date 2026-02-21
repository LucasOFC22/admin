
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ArrowRight } from "lucide-react";

interface QuickAccessLink {
  title: string;
  icon: React.ElementType;
  path: string;
}

interface QuickAccessCardProps {
  links: QuickAccessLink[];
}

const QuickAccessCard = ({ links }: QuickAccessCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="h-full"
    >
      <Card className="h-full border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
        {/* Header with gradient */}
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white pb-4">
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2">
              <Zap className="h-5 w-5" />
            </div>
            Acesso Rápido
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {links.map((item, index) => (
              <motion.a
                key={item.title}
                href={item.path}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="group block"
              >
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-blue-50 hover:to-cyan-50 rounded-xl transition-all duration-300 hover:shadow-md border border-gray-200/50 hover:border-blue-200">
                  {/* Icon container */}
                  <div className="bg-white rounded-xl p-3 shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-110">
                    <item.icon className="h-6 w-6 text-blue-600 group-hover:text-cyan-600 transition-colors" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                      Acessar módulo
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </motion.a>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuickAccessCard;
