import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
const STORAGE_KEY = 'aerovision_active_farmers';
const FarmerContext = createContext(null);
export function FarmerProvider({ children }) {
  const [activeFarmers, setActiveFarmers] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeFarmers));
  }, [activeFarmers]);
    const addFarmer = useCallback((email, sessionId, extra = {}) => {
    setActiveFarmers((prev) => {
      if (prev.some((f) => f.sessionId === sessionId)) return prev;
      return [
        ...prev,
        {
          email,
          sessionId,
          verifiedAt: new Date().toISOString(),
          qrToken:      extra.qrToken      ?? null,
          appLinkStatus: extra.appLinkStatus ?? 'pending_app_install',
        },
      ];
    });
  }, []);
    const removeFarmer = useCallback((sessionId) => {
    setActiveFarmers((prev) => prev.filter((f) => f.sessionId !== sessionId));
  }, []);
    const getFarmer = useCallback(
    (sessionId) => activeFarmers.find((f) => f.sessionId === sessionId) || null,
    [activeFarmers]
  );
    const updateFarmer = useCallback((sessionId, patch) => {
    setActiveFarmers((prev) =>
      prev.map((f) => (f.sessionId === sessionId ? { ...f, ...patch } : f))
    );
  }, []);
  const value = useMemo(
    () => ({
      activeFarmers,
      addFarmer,
      removeFarmer,
      getFarmer,
      updateFarmer,
    }),
    [activeFarmers, addFarmer, removeFarmer, getFarmer, updateFarmer]
  );
  return <FarmerContext.Provider value={value}>{children}</FarmerContext.Provider>;
}
export function useFarmers() {
  const ctx = useContext(FarmerContext);
  if (!ctx) {
    throw new Error('useFarmers must be used within FarmerProvider');
  }
  return ctx;
}