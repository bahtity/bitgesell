const request = require('supertest');
const express = require('express');
const router = require('./items'); // <-- update this path

// Mock fs.promises to avoid real file IO
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  }
}));

const fs = require('fs').promises;

describe('Items API', () => {
  let app;

  // Your provided sample items data
  const sampleData = [
    { id: 1, name: "Laptop Pro", category: "Electronics", price: 2499 },
    { id: 2, name: "Noise Cancelling Headphones", category: "Electronics", price: 399 },
    { id: 3, name: "Ultra‑Wide Monitor", category: "Electronics", price: 999 },
    { id: 4, name: "Ergonomic Chair", category: "Furniture", price: 799 },
    { id: 5, name: "Standing Desk", category: "Furniture", price: 1199 }
  ];

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/items', router);

    // Error handler middleware to catch thrown errors
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({ message: err.message });
    });
  });

  beforeEach(() => {
    // Reset mocks before each test
    fs.readFile.mockReset();
    fs.writeFile.mockReset();

    // Default readFile returns sampleData
    fs.readFile.mockResolvedValue(JSON.stringify(sampleData));
    fs.writeFile.mockResolvedValue();
  });

  describe('GET /api/items', () => {
    it('should return all items with default pagination', async () => {
      const res = await request(app).get('/api/items');
      expect(res.statusCode).toBe(200);
      expect(res.body.items.length).toBe(sampleData.length);
      expect(res.body.total).toBe(sampleData.length);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(20);
    });

    it('should return paginated items', async () => {
      const res = await request(app).get('/api/items?limit=2&page=2');
      expect(res.statusCode).toBe(200);
      expect(res.body.items.length).toBe(2); // Items #3 and #4 on page 2
      expect(res.body.page).toBe(2);
      expect(res.body.limit).toBe(2);
      expect(res.body.total).toBe(sampleData.length);

      // Check items are correct slice
      expect(res.body.items[0].id).toBe(3);
      expect(res.body.items[1].id).toBe(4);
    });

    it('should filter items by search query', async () => {
      const res = await request(app).get('/api/items?q=monitor');
      expect(res.statusCode).toBe(200);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].name).toBe('Ultra‑Wide Monitor');
    });

    it('should return empty list if no match in search', async () => {
      const res = await request(app).get('/api/items?q=nonexistent');
      expect(res.statusCode).toBe(200);
      expect(res.body.items.length).toBe(0);
      expect(res.body.total).toBe(0);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return item with the given id', async () => {
      const res = await request(app).get('/api/items/2');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(sampleData[1]);
    });

    it('should return 404 if item not found', async () => {
      const res = await request(app).get('/api/items/999');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Item not found');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item with valid payload', async () => {
      const newItem = { name: 'Wireless Mouse', category: 'Electronics', price: 49.99 };

      const res = await request(app)
        .post('/api/items')
        .send(newItem);

      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject(newItem);
      expect(res.body).toHaveProperty('id');
      expect(typeof res.body.id).toBe('number');
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
    });

    it('should reject if "name" is missing or invalid', async () => {
      const invalidItems = [
        {},
        { name: '', category: 'Electronics', price: 10 },
        { name: 123, category: 'Electronics', price: 10 }
      ];

      for (const invalidItem of invalidItems) {
        const res = await request(app)
          .post('/api/items')
          .send(invalidItem);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/name/i);
      }
    });

    it('should reject if "category" is missing or invalid', async () => {
      const invalidItems = [
        { name: 'Mouse' },
        { name: 'Mouse', category: '', price: 10 },
        { name: 'Mouse', category: 123, price: 10 }
      ];

      for (const invalidItem of invalidItems) {
        const res = await request(app)
          .post('/api/items')
          .send(invalidItem);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/category/i);
      }
    });

    it('should reject if "price" is missing or invalid', async () => {
      const invalidItems = [
        { name: 'Mouse', category: 'Electronics' },
        { name: 'Mouse', category: 'Electronics', price: 0 },
        { name: 'Mouse', category: 'Electronics', price: -5 },
        { name: 'Mouse', category: 'Electronics', price: 'free' }
      ];

      for (const invalidItem of invalidItems) {
        const res = await request(app)
          .post('/api/items')
          .send(invalidItem);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/price/i);
      }
    });
  });
});
