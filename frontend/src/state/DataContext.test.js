import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { DataProvider, useData } from './DataContext';

// Mock global fetch
global.fetch = jest.fn();

describe('DataContext', () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  it('fetchItems fetches data and updates state', async () => {
    const fakeResponse = {
      items: [{ id: 1, name: 'Item 1' }],
      total: 1,
    };

    fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(fakeResponse),
    });

    const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await result.current.fetchItems({ page: 2, limit: 10, q: 'test' }, undefined);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2&limit=10&q=test'),
      expect.anything()
    );
    expect(result.current.items).toEqual(fakeResponse.items);
    expect(result.current.total).toBe(fakeResponse.total);
  });

  it('fetchItems handles fetch failure gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await expect(result.current.fetchItems({}, undefined)).rejects.toThrow('Failed to fetch');
    });
  });

  it('fetchItems handles undefined or bad JSON response', async () => {
    fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(undefined),
    });

    const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
    const { result } = renderHook(() => useData(), { wrapper });

    // Should not throw but setItems and setTotal won't update meaningfully
    await act(async () => {
      await result.current.fetchItems({}, undefined);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });
});
