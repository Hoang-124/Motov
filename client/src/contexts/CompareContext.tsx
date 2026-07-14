import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Motorbike } from '../services/vehicleService';

interface CompareContextType {
  compareList: Motorbike[];
  addToCompare: (bike: Motorbike) => boolean; // returns false if max reached
  removeFromCompare: (bikeId: string) => void;
  clearCompare: () => void;
  isInCompare: (bikeId: string) => boolean;
  canAddMore: boolean;
}

const CompareContext = createContext<CompareContextType | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<Motorbike[]>([]);

  const addToCompare = useCallback((bike: Motorbike): boolean => {
    if (compareList.length >= 3) return false;
    if (compareList.some(b => b._id === bike._id)) return true;
    setCompareList(prev => [...prev, bike]);
    return true;
  }, [compareList]);

  const removeFromCompare = useCallback((bikeId: string) => {
    setCompareList(prev => prev.filter(b => b._id !== bikeId));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  const isInCompare = useCallback((bikeId: string): boolean => {
    return compareList.some(b => b._id === bikeId);
  }, [compareList]);

  return (
    <CompareContext.Provider value={{
      compareList,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      canAddMore: compareList.length < 3
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
