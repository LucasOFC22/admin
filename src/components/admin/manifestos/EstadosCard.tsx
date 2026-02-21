import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EstadoStat } from '@/types/manifesto';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface EstadosCardProps {
  estados: EstadoStat[];
}

export const EstadosCard = ({ estados }: EstadosCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border border-border/60">
        <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <CardTitle className="text-sm sm:text-base font-medium">Viagens por Estado</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2">
            {estados.map((estado, index) => (
              <motion.div
                key={estado.estado}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.03 }}
              >
                <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                  <div className="text-sm sm:text-lg font-semibold text-foreground">
                    {estado.count}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    {estado.estado}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
