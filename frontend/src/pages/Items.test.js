import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Items from './Items';
import '@testing-library/jest-dom';





// ✅ Mock react-window
jest.mock('react-window', () => {
  const React = require('react');
  return {
    FixedSizeList: ({ itemCount, children }) => (
      <div data-testid="virtual-list">
        {Array.from({ length: itemCount }, (_, index) =>
          children({ index, style: {} })
        )}
      </div>
    )
  };
});

// ✅ Mock AutoSizer
jest.mock('react-virtualized-auto-sizer', () => {
  return ({ children }) =>
    children({ height: 600, width: 800 }); // Simulate container size
});

// ✅ Mock useData
jest.mock('../state/DataContext', () => ({
  useData: () => ({
    items: [
      { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 2499 },
      { id: 2, name: 'Noise Cancelling Headphones', category: 'Electronics', price: 399 },
      { id: 3, name: 'Ultra‑Wide Monitor', category: 'Electronics', price: 999 },
      { id: 4, name: 'Ergonomic Chair', category: 'Furniture', price: 799 },
      { id: 5, name: 'Standing Desk', category: 'Furniture', price: 1199 }
    ],
    total: 5,
    fetchItems: jest.fn(() => Promise.resolve())
  })
}));

describe('Items page', () => {
  it('renders list of items and pagination controls', () => {
    render( 
        <MemoryRouter future={{ v7_startTransition: true }}>
          <Items />
        </MemoryRouter>
        );

    // Check for rendered items
    expect(screen.getByText('Laptop Pro')).toBeInTheDocument();
    expect(screen.getByText('Standing Desk')).toBeInTheDocument();

    // Check for pagination controls
    expect(screen.getByText(/Page 1 of/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
  });
});
