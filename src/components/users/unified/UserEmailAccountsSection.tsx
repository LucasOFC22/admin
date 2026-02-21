import React from 'react';
import { Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import UserEmailAccountsSelect from '@/components/admin/users/UserEmailAccountsSelect';

interface UserEmailAccountsSectionProps {
  selectedAccountIds: string[];
  defaultAccountId?: string;
  onAccountsChange: (ids: string[]) => void;
  onDefaultChange: (id: string | undefined) => void;
  disabled?: boolean;
}

const UserEmailAccountsSection: React.FC<UserEmailAccountsSectionProps> = ({
  selectedAccountIds,
  defaultAccountId,
  onAccountsChange,
  onDefaultChange,
  disabled = false
}) => {
  return (
    <>
      <Separator />
      
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Mail className="w-4 h-4" />
          Contas de Email
        </div>
        
        <p className="text-xs text-muted-foreground">
          Selecione as contas de email que este usuário terá acesso. 
          Sem contas vinculadas, o usuário não poderá acessar o módulo de email.
        </p>
        
        <UserEmailAccountsSelect
          selectedIds={selectedAccountIds}
          defaultAccountId={defaultAccountId}
          onSelectionChange={onAccountsChange}
          onDefaultChange={onDefaultChange}
        />
      </div>
    </>
  );
};

export default UserEmailAccountsSection;
