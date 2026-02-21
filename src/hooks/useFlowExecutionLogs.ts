import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { FlowExecutionLog, FlowSession } from '@/types/flowExecutionLogs';

interface UseFlowExecutionLogsOptions {
  sessionId?: string;
  limit?: number;
  realtime?: boolean;
}

export const useFlowExecutionLogs = (options: UseFlowExecutionLogsOptions = {}) => {
  const { sessionId, limit = 100, realtime = true } = options;
  const [logs, setLogs] = useState<FlowExecutionLog[]>([]);
  const [sessions, setSessions] = useState<FlowSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const authClient = requireAuthenticatedClient();
      let query = authClient
        .from('flow_execution_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (sessionId) query = query.eq('session_id', sessionId);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, limit]);

  const fetchSessions = useCallback(async () => {
    try {
      const authClient = requireAuthenticatedClient();
      const query = authClient
        .from('flow_sessions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setSessions(data || []);
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchSessions();
  }, [fetchLogs, fetchSessions]);

  // Realtime subscription - usa cliente anônimo
  useEffect(() => {
    if (!realtime) return;

    const channel = supabase
      .channel('flow-execution-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'flow_execution_logs'
        },
        (payload) => {
          const newLog = payload.new as FlowExecutionLog;
          
          if (sessionId && newLog.session_id !== sessionId) return;

          setLogs(prev => [newLog, ...prev].slice(0, limit));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flow_sessions'
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtime, sessionId, limit, fetchSessions]);

  const clearLogs = useCallback(async (filters?: { sessionId?: string }) => {
    try {
      const authClient = requireAuthenticatedClient();
      let query = authClient.from('flow_execution_logs').delete();
      
      if (filters?.sessionId) query = query.eq('session_id', filters.sessionId);
      
      // If no filters, we need at least one condition
      if (!filters?.sessionId) {
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { error } = await query;
      if (error) throw error;
      
      await fetchLogs();
    } catch (err: any) {
      console.error('Error clearing logs:', err);
      setError(err.message);
    }
  }, [fetchLogs]);

  return {
    logs,
    sessions,
    loading,
    error,
    refetch: fetchLogs,
    clearLogs
  };
};
