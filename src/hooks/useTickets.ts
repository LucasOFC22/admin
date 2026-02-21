import { useInfiniteQuery } from "@tanstack/react-query";
import { ticketService, GetTicketsParams } from "@/services/ticketService";

export const useTickets = (params: GetTicketsParams) => {
  const queryKey = [
    'tickets',
    params.searchParam,
    params.tags,
    params.users,
    params.status,
    params.showAll,
    params.queueIds,
    params.whatsappIds,
    params.sortTickets,
    params.searchOnMessages
  ];

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const result = await ticketService.getTickets({ ...params, pageNumber: pageParam });
      return { ...result, currentPage: pageParam };
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30000, // 30 segundos de cache
    gcTime: 5 * 60 * 1000, // 5 minutos no garbage collector
  });

  const tickets = data?.pages.flatMap(page => page.tickets) ?? [];
  const count = data?.pages[0]?.count ?? 0;

  return {
    tickets,
    loading: isLoading,
    hasMore: hasNextPage ?? false,
    count,
    fetchNextPage,
    isFetchingNextPage
  };
};
