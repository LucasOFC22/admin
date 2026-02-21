
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Shield } from 'lucide-react';

interface TipoSelectorProps {
  onTipoSelected: (tipo: 'cliente' | 'admin') => void;
  currentTipo?: 'cliente' | 'admin';
}

const TipoSelector = ({ onTipoSelected, currentTipo }: TipoSelectorProps) => {
  return (
    <div className="flex gap-4 mb-6">
      <Card 
        className={`cursor-pointer transition-all duration-200 ${
          currentTipo === 'cliente' 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }`}
        onClick={() => onTipoSelected('cliente')}
      >
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className={`p-4 rounded-full ${
              currentTipo === 'cliente' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <Users className={`h-8 w-8 ${
                currentTipo === 'cliente' ? 'text-blue-600' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Clientes</h3>
              <p className="text-sm text-gray-600">Gerenciar clientes do sistema</p>
            </div>
            <Button 
              variant={currentTipo === 'cliente' ? 'default' : 'outline'}
              size="sm"
            >
              {currentTipo === 'cliente' ? 'Selecionado' : 'Selecionar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-all duration-200 ${
          currentTipo === 'admin' 
            ? 'border-purple-500 bg-purple-50 shadow-md' 
            : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
        }`}
        onClick={() => onTipoSelected('admin')}
      >
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className={`p-4 rounded-full ${
              currentTipo === 'admin' ? 'bg-purple-100' : 'bg-gray-100'
            }`}>
              <Shield className={`h-8 w-8 ${
                currentTipo === 'admin' ? 'text-purple-600' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Administradores</h3>
              <p className="text-sm text-gray-600">Gerenciar usuários admin</p>
            </div>
            <Button 
              variant={currentTipo === 'admin' ? 'default' : 'outline'}
              size="sm"
            >
              {currentTipo === 'admin' ? 'Selecionado' : 'Selecionar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TipoSelector;
