import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { contatosService, ContatoWhatsApp } from '@/services/contatos/contatosService';

interface ContatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contato?: ContatoWhatsApp | null;
}

const ContatoModal: React.FC<ContatoModalProps> = ({
  isOpen,
  onClose,
  contato
}) => {
  const { toast } = useToast();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (contato) {
      setNome(contato.nome);
      setTelefone(contato.telefone);
    } else {
      setNome('');
      setTelefone('');
    }
  }, [contato, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !telefone.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      if (contato) {
        await contatosService.atualizar(contato.id, { nome, telefone });
        toast({
          title: 'Sucesso',
          description: 'Contato atualizado com sucesso'
        });
      } else {
        await contatosService.criar({ nome, telefone });
        toast({
          title: 'Sucesso',
          description: 'Contato criado com sucesso'
        });
      }
      handleClose();
      // Recarregar a lista de contatos
      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao salvar contato:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o contato',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNome('');
    setTelefone('');
    onClose();
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Formata conforme o tamanho
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    
    return numbers.slice(0, 11)
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setTelefone(formatted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {contato ? 'Editar Contato' : 'Criar Contato'}
          </DialogTitle>
          <DialogDescription>
            {contato
              ? 'Edite as informações do contato'
              : 'Cadastre um novo contato do WhatsApp'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Digite o nome do contato"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={handlePhoneChange}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Digite o número com DDD
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : contato ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContatoModal;
