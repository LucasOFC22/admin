import React, { useState, useEffect } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TagModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (tag: { name: string; color: string }) => void;
  initialData?: { name: string; color: string };
  isEditing?: boolean;
}

const TagModal: React.FC<TagModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEditing = false,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#667eea');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setColor(initialData.color);
    } else {
      setName('');
      setColor('#667eea');
    }
  }, [initialData, open]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Tag' : 'Criar Tag'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Nome</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome da tag..."
            />
          </div>

          <div className="space-y-3">
            <Label>Cor</Label>
            <div className="flex flex-col items-center gap-4">
              <HexColorPicker
                color={color}
                onChange={setColor}
                style={{ width: '100%', height: '180px' }}
              />
              
              <div className="flex items-center gap-4 w-full">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1">
                  <Label htmlFor="hex-input" className="text-xs text-muted-foreground">
                    HEX
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted-foreground">#</span>
                    <HexColorInput
                      color={color}
                      onChange={setColor}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring uppercase"
                      prefixed={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="px-4 py-2 rounded-md text-white text-sm font-medium text-center"
              style={{ backgroundColor: color }}
            >
              {name || 'Nome da tag'}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TagModal;
