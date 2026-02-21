import React from 'react';
import { useWhatsAppTickets } from '@/hooks/useWhatsAppTickets';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useGlobalMessageSearch } from '@/hooks/useGlobalMessageSearch';
import { useScrollToMessage } from '@/contexts/ScrollToMessageContext';
import { 
  useTicketsFilters, 
  useTicketsModals, 
  useTicketsActions, 
  useFilterData 
} from './hooks';
import {
  TicketsSearchBar,
  TicketsFiltersPanel,
  TicketsActionBar,
  TicketsTabNavigation,
  TicketsListContainer,
  TicketsModalsManager,
  GlobalSearchResults,
  TicketSkeleton
} from './components';
import { TicketsManagerTabsProps } from './types';

export const TicketsManagerTabs: React.FC<TicketsManagerTabsProps> = ({
  selectedTicketId,
  onSelectTicket,
  onAcceptTicket,
  onTransferTicket,
  onCloseTicket,
  isAdmin
}) => {
  const { 
    tickets, 
    filas, 
    isLoading,
    isLoadingMoreTickets,
    hasMoreTickets,
    loadMoreTickets,
    resolveTicket,
    cancelTicket,
    reopenTicket,
    acceptTransfer, 
    rejectTransfer, 
    filasPermitidas, 
    hasFilasRestriction 
  } = useWhatsAppTickets({ mode: 'list', pageSize: 50 });
  
  const { hasPermission } = usePermissionGuard();
  const { setMessageIdToScrollTo } = useScrollToMessage();
  
  // Permissões de ações
  const canAcceptTicket = hasPermission('admin.whatsapp.aceitar');
  const canIgnoreTicket = hasPermission('admin.whatsapp.ignorar');
  const canTransferTicket = hasPermission('admin.whatsapp.transferir');
  const canCloseTicket = hasPermission('admin.whatsapp.finalizar');
  const canCloseSilently = hasPermission('admin.whatsapp.finalizar-silencioso');
  const canViewAllTickets = hasPermission('admin.whatsapp.ver_conversas_outros');
  
  // Hooks customizados
  const { conexoes, usuarios, currentUser } = useFilterData();
  
  const {
    filters,
    updateFilter,
    toggleFilter,
    toggleSortOrder,
    clearFilters,
    hasActiveFilters,
    filteredTickets,
    openCount,
    pendingCount
  } = useTicketsFilters(tickets, filas, currentUser, canViewAllTickets);

  // Busca global em mensagens
  const { chatResults, messageResults, isSearching, hasResults } = useGlobalMessageSearch(filters.searchParam);
  const isGlobalSearchActive = filters.searchParam.length >= 2;

  const {
    modals,
    openNewTicketDialog,
    closeNewTicketDialog,
    openAcceptModal,
    closeAcceptModal,
    setIsAccepting,
    setIsClosing,
    openTransferModal,
    closeTransferModal,
    openCloseConfirm,
    closeCloseConfirm
  } = useTicketsModals();

  const {
    handleCloseAll,
    handleAcceptWithQueue,
    handleTransfer,
    handleConfirmClose
  } = useTicketsActions({
    tickets,
    filasPermitidas: filasPermitidas.map(Number),
    hasFilasRestriction,
    resolveTicket,
    cancelTicket,
    reopenTicket,
    onAcceptTicket,
    modals,
    closeAcceptModal,
    closeTransferModal,
    closeCloseConfirm,
    setIsAccepting,
    setIsClosing
  });

  // Handler para selecionar chat da busca global
  const handleSelectSearchChat = (chatId: number) => {
    const ticket = tickets.find(t => Number(t.chatId) === chatId || Number(t.id) === chatId);
    if (ticket) {
      onSelectTicket?.(String(ticket.id));
    } else {
      onSelectTicket?.(String(chatId));
    }
  };

  // Handler para selecionar mensagem específica da busca global
  const handleSelectSearchMessage = (chatId: number, messageId: string) => {
    // Setar o ID da mensagem para scroll
    setMessageIdToScrollTo(messageId);
    
    // Selecionar o ticket correspondente
    const ticket = tickets.find(t => Number(t.chatId) === chatId || Number(t.id) === chatId);
    if (ticket) {
      onSelectTicket?.(String(ticket.id));
    } else {
      onSelectTicket?.(String(chatId));
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div 
        style={{ 
          border: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '4px',
          backgroundColor: 'white'
        }}
        className="flex flex-col h-full"
      >
        {/* Search Bar */}
        <TicketsSearchBar
          searchParam={filters.searchParam}
          onSearchChange={(value) => updateFilter('searchParam', value)}
          showFilters={filters.showFilters}
          hasActiveFilters={hasActiveFilters}
          onToggleFilters={() => toggleFilter('showFilters')}
        />

        {/* Show global search results when searching */}
        {isGlobalSearchActive ? (
          <div className="flex-1 overflow-hidden">
            <GlobalSearchResults
              searchTerm={filters.searchParam}
              chatResults={chatResults}
              messageResults={messageResults}
              isSearching={isSearching}
              onSelectChat={handleSelectSearchChat}
              onSelectMessage={handleSelectSearchMessage}
            />
          </div>
        ) : (
          <>
            {/* Filters Panel */}
            {filters.showFilters && (
              <TicketsFiltersPanel
                filas={filas}
                conexoes={conexoes}
                usuarios={usuarios}
                selectedFilas={filters.selectedFilas}
                selectedConnections={filters.selectedConnections}
                selectedModoAtendimento={filters.selectedModoAtendimento}
                selectedUsers={filters.selectedUsers}
                onFilasChange={(value) => updateFilter('selectedFilas', value)}
                onConnectionsChange={(value) => updateFilter('selectedConnections', value)}
                onModoAtendimentoChange={(value) => updateFilter('selectedModoAtendimento', value)}
                onUsersChange={(value) => updateFilter('selectedUsers', value)}
                onClearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
                canViewAllTickets={canViewAllTickets}
              />
            )}

            {/* Action Buttons */}
            <TicketsActionBar
              showAll={filters.showAll}
              showResolved={filters.showResolved}
              sortOrder={filters.sortOrder}
              openCount={openCount}
              filas={filas}
              onShowAllToggle={() => toggleFilter('showAll')}
              onNewTicket={openNewTicketDialog}
              onCloseAll={handleCloseAll}
              onShowResolvedToggle={(value) => updateFilter('showResolved', value)}
              onSortToggle={toggleSortOrder}
              canViewAllTickets={canViewAllTickets}
            />

            {/* Tabs - Hidden when showResolved is true */}
            {!filters.showResolved && (
              <TicketsTabNavigation
                currentTab={filters.currentTab}
                openCount={openCount}
                pendingCount={pendingCount}
                onTabChange={(tab) => updateFilter('currentTab', tab)}
              />
            )}

            {/* Tickets List */}
            <div className="flex-1 overflow-auto" style={{ borderRadius: '4px' }}>
              <div style={{ backgroundColor: 'white', height: '100%' }}>
                {isLoading && tickets.length === 0 ? (
                  <TicketSkeleton count={8} />
                ) : (
                  <TicketsListContainer
                    tickets={filteredTickets}
                    filas={filas}
                    selectedTicketId={selectedTicketId}
                    currentTab={filters.currentTab}
                    currentUser={currentUser}
                    canAcceptTicket={canAcceptTicket}
                    canTransferTicket={canTransferTicket}
                    canIgnoreTicket={canIgnoreTicket}
                    canCloseTicket={canCloseTicket}
                    filasPermitidas={filasPermitidas.map(Number)}
                    hasFilasRestriction={hasFilasRestriction}
                    onSelectTicket={onSelectTicket}
                    onOpenAcceptModal={openAcceptModal}
                    onOpenTransferModal={openTransferModal}
                    onOpenCloseConfirm={openCloseConfirm}
                    onAcceptTransfer={acceptTransfer}
                    onRejectTransfer={rejectTransfer}
                    onLoadMore={loadMoreTickets}
                    hasMore={hasMoreTickets}
                    isLoadingMore={isLoadingMoreTickets}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Modals Manager */}
      <TicketsModalsManager
        modals={modals}
        filas={filas}
        tickets={tickets}
        onCloseNewTicketDialog={closeNewTicketDialog}
        onCloseAcceptModal={closeAcceptModal}
        onCloseTransferModal={closeTransferModal}
        onCloseCloseConfirm={closeCloseConfirm}
        onAcceptWithQueue={handleAcceptWithQueue}
        onTransfer={handleTransfer}
        onConfirmClose={handleConfirmClose}
        canCloseSilently={canCloseSilently}
      />
    </div>
  );
};

export default TicketsManagerTabs;
