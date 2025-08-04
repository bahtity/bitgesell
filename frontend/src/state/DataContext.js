import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const fetchItems = useCallback(async ({ page = 1, limit = 20, q = '' }, signal) => {
    const params = new URLSearchParams({ page, limit, q });
    const res = await fetch(`http://localhost:3001/api/items?${params.toString()}`, { signal });

    const json = await res.json();
    setItems(json?.items ?? []);
    setTotal(json?.total ?? 0);
}, []);

  return (
    <DataContext.Provider value={{ items, fetchItems, total }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
