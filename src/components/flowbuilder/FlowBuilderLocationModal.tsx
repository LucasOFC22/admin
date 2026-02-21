import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VariableAutocomplete } from './VariableAutocomplete';

interface LocationData {
  latitude: string;
  longitude: string;
  name: string;
  address: string;
  title?: string;
}

interface FlowBuilderLocationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { location: LocationData }) => void;
  onUpdate?: (data: any) => void;
  data?: any;
  mode?: 'create' | 'edit';
}

export const FlowBuilderLocationModal: React.FC<FlowBuilderLocationModalProps> = ({
  open,
  onClose,
  onSave,
  onUpdate,
  data,
  mode = 'create'
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<LocationData>({
    latitude: '',
    longitude: '',
    name: '',
    address: ''
  });

  const initialDataRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!open) {
      initialDataRef.current = null;
      return;
    }
    
    const dataKey = JSON.stringify(data?.data || null);
    if (initialDataRef.current === dataKey) return;
    
    initialDataRef.current = dataKey;
    
    if (mode === 'edit' && data?.data?.location) {
      setFormData(data.data.location);
    } else if (mode === 'create') {
      setFormData({
        latitude: '',
        longitude: '',
        name: '',
        address: ''
      });
    }
  }, [mode, data, open]);

  const handleChange = (field: keyof LocationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.latitude || !formData.longitude) {
      toast({
        title: "Erro",
        description: "Por favor, preencha latitude e longitude",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'edit' && onUpdate) {
      onUpdate({
        ...data,
        data: { 
          ...data.data,
          location: formData 
        }
      });
    } else {
      onSave({ location: formData });
    }
    // Não chamar onClose() aqui - handleModalSave já fecha o modal
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {mode === 'create' ? 'Adicionar localização ao fluxo' : 'Editar localização'}
          </DialogTitle>
          <DialogDescription>
            Configure uma localização para enviar ao usuário via WhatsApp
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude *</Label>
              <VariableAutocomplete
                id="latitude"
                value={formData.latitude}
                onChange={(value) => handleChange('latitude', value)}
                placeholder="-23.550520"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <VariableAutocomplete
                id="longitude"
                value={formData.longitude}
                onChange={(value) => handleChange('longitude', value)}
                placeholder="-46.633308"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do local</Label>
            <VariableAutocomplete
              id="name"
              value={formData.name}
              onChange={(value) => handleChange('name', value)}
              placeholder="Ex: Escritório Central"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço completo</Label>
            <VariableAutocomplete
              id="address"
              value={formData.address}
              onChange={(value) => handleChange('address', value)}
              placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
            />
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Preview do JSON:</p>
            <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`{
  "type": "location",
  "location": {
    "latitude": "${formData.latitude || '<LOCATION_LATITUDE>'}",
    "longitude": "${formData.longitude || '<LOCATION_LONGITUDE>'}",
    "name": "${formData.name || '<LOCATION_NAME>'}",
    "address": "${formData.address || '<LOCATION_ADDRESS>'}"
  }
}`}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {mode === 'create' ? 'Adicionar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
