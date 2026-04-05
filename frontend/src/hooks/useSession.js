import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const SESSION_KEY = 'pos_session';

export function useSession(branchId) {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);

  // Verify session is still open on mount (in case it was closed elsewhere)
  useEffect(() => {
    if (!branchId) { setLoading(false); return; }
    api.get(`/sessions/current?branchId=${branchId}`)
      .then(({ data }) => {
        if (data.session) {
          setSession(data.session);
          localStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
        } else {
          // No open session — clear stale local state
          setSession(null);
          localStorage.removeItem(SESSION_KEY);
        }
      })
      .catch(() => {
        // Offline — keep local state
      })
      .finally(() => setLoading(false));
  }, [branchId]);

  const openSession = useCallback(async (openingCash) => {
    setOpening(true);
    try {
      const { data } = await api.post('/sessions/open', {
        openingCash: Number(openingCash),
        branchId,
      });
      setSession(data.session);
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      if (data.resumed) {
        toast.success('Resumed existing session');
      } else {
        toast.success(`Session opened with ₹${Number(openingCash).toFixed(2)} opening balance`);
      }
      return data.session;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open session');
      return null;
    } finally {
      setOpening(false);
    }
  }, [branchId]);

  const closeSession = useCallback(async (closingCash) => {
    if (!session?._id) return null;
    setClosing(true);
    try {
      const { data } = await api.put(`/sessions/${session._id}/close`, {
        closingCash: Number(closingCash),
      });
      setSession(null);
      localStorage.removeItem(SESSION_KEY);
      toast.success('Session closed successfully');
      return data.session;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close session');
      return null;
    } finally {
      setClosing(false);
    }
  }, [session]);

  // Re-fetch the session from DB to get latest cashSales/totalSales
  const refreshSession = useCallback(async () => {
    if (!session?._id) return;
    try {
      const { data } = await api.get(`/sessions/current?branchId=${branchId || ''}`);
      if (data.session) {
        setSession(data.session);
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      }
    } catch {
      // ignore — keep stale data
    }
  }, [session, branchId]);

  return { session, loading, opening, closing, openSession, closeSession, refreshSession };
}
