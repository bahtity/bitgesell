import React, { useEffect, useState } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

function Items() {
  const { items, fetchItems, total } = useData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 100; // Load a bigger page for smoother scroll
  const itemHeight = 50;

  useEffect(() => {
    const controller = new AbortController();
    fetchItems({ page, limit, q: search }, controller.signal).catch(err => {
      if (err.name !== 'AbortError') console.error(err);
    });
    return () => controller.abort();
  }, [page, search, fetchItems]);

  const totalPages = Math.ceil(total / limit);

  const Row = ({ index, style }) => {
    const item = items[index];
    if (!item) return null;
    return (
      <div style={style} key={item.id}>
        <Link to={`/items/${item.id}`} >{item.name}</Link>
      </div>
    );
  };

  return (
    <div style={{ height: '100vh', padding: '1rem' }}>
      <input
        type="text"
        placeholder="Search items..."
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setPage(1);
        }}
        style={{ marginBottom: '1rem', padding: '0.5rem', width: '100%' }}
      />

      {items.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <div style={{ flex: 1, height: '80vh' }}>
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                itemCount={items.length}
                itemSize={itemHeight}
                width={width}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
          Previous
        </button>
        <span style={{ margin: '0 1rem' }}>
          Page {page} of {totalPages || 1}
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export default Items;
