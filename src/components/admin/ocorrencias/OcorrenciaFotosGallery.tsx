import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface OcorrenciaFotosGalleryProps {
  fotos: string[];
}

const OcorrenciaFotosGallery = ({ fotos }: OcorrenciaFotosGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!fotos || fotos.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < fotos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fotos.map((foto, index) => (
          <div
            key={index}
            className="relative aspect-square overflow-hidden rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setSelectedIndex(index)}
          >
            <img
              src={foto}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedIndex !== null && (
            <div className="relative">
              <img
                src={fotos[selectedIndex]}
                alt={`Foto ${selectedIndex + 1}`}
                className="w-full h-auto"
              />
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  disabled={selectedIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">
                  {selectedIndex + 1} / {fotos.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={selectedIndex === fotos.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm"
                onClick={() => setSelectedIndex(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OcorrenciaFotosGallery;
