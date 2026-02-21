import { useState, useEffect, useMemo } from 'react';
import { n8nUsersService, N8nUserProfile } from '@/services/n8n/usersService';

export interface MentionUser {
  id: string;
  name: string;
  email: string;
}

export const useMentionAutocomplete = () => {
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar usuários ativos
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const fetchedUsers = await n8nUsersService.getUsers({ 
          tipo: 'admin', 
          ativo: true 
        });
        
        const mappedUsers: MentionUser[] = (fetchedUsers || []).map((user: N8nUserProfile) => ({
          id: user.id,
          name: user.name,
          email: user.email,
        }));
        
        setUsers(mappedUsers);
      } catch (error) {
        console.error('Erro ao carregar usuários para menções:', error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Filtrar usuários baseado no termo de busca
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(
      user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  return {
    users,
    filteredUsers,
    isLoading,
    searchTerm,
    setSearchTerm,
  };
};

// Utilitário para extrair menções do texto
export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[2]); // ID do usuário
  }
  
  return mentions;
};

// Utilitário para converter menções em texto exibível
export const formatMentionsForDisplay = (text: string): string => {
  // Converte @[Nome](id) para @Nome
  return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
};

// Utilitário para inserir menção no texto
export const insertMention = (
  text: string, 
  cursorPos: number, 
  user: MentionUser
): { newText: string; newCursorPos: number } => {
  // Encontrar o @ antes do cursor
  const beforeCursor = text.slice(0, cursorPos);
  const afterCursor = text.slice(cursorPos);
  
  // Encontrar a posição do último @
  const atIndex = beforeCursor.lastIndexOf('@');
  
  if (atIndex === -1) {
    return { newText: text, newCursorPos: cursorPos };
  }
  
  // Texto antes do @
  const prefix = text.slice(0, atIndex);
  
  // Inserir a menção formatada
  const mention = `@[${user.name}](${user.id}) `;
  const newText = prefix + mention + afterCursor;
  const newCursorPos = prefix.length + mention.length;
  
  return { newText, newCursorPos };
};
