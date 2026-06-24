import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Inventory } from '../models/Inventory.js';

let mongod: MongoMemoryServer | null = null;

beforeAll(async () => {
  try {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  } catch (err) {
    console.warn('Could not start MongoMemoryServer. Falling back to local MongoDB test database.');
    await mongoose.connect('mongodb://localhost:27017/Motov_test_inventory');
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

afterEach(async () => {
  await Inventory.deleteMany({});
});

const createMockRes = () => {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (body: any) => { res._body = body; return res; };
  return res;
};

describe('Inventory Controller Tests', () => {
  let getAllInventory: any;
  let createInventory: any;
  let updateInventory: any;
  let deleteInventory: any;
  let updateStock: any;

  beforeAll(async () => {
    ({
      getAllInventory,
      createInventory,
      updateInventory,
      deleteInventory,
      updateStock
    } = await import('../controllers/inventoryController.js'));
  });

  describe('createInventory()', () => {
    it('should create a new inventory item successfully', async () => {
      const req: any = {
        body: {
          name: 'Má phanh Brembo',
          sku: 'PHANH-BRE-01',
          quantity: 10,
          minQuantity: 3,
          price: 450000,
          location: 'Kệ B, Ngăn 1',
          description: 'Má phanh trước hiệu năng cao'
        }
      };
      const res = createMockRes();
      await createInventory(req, res);

      expect(res._status).toBe(201);
      expect(res._body.success).toBe(true);
      expect(res._body.data.name).toBe('Má phanh Brembo');
      expect(res._body.data.sku).toBe('PHANH-BRE-01');
    });

    it('should fail if duplicate name or SKU is added', async () => {
      await Inventory.create({
        name: 'Săm xe Casumina',
        sku: 'SAM-CAS-01',
        quantity: 5,
        price: 50000
      });

      const req: any = {
        body: {
          name: 'Săm xe Casumina',
          sku: 'SAM-CAS-01',
          quantity: 10,
          price: 50000
        }
      };
      const res = createMockRes();
      await createInventory(req, res);

      expect(res._status).toBe(400);
      expect(res._body.success).toBe(false);
      expect(res._body.error).toContain('đã tồn tại');
    });
  });

  describe('getAllInventory()', () => {
    it('should return all inventory items sorted by name', async () => {
      await Inventory.create([
        { name: 'Xích DID', sku: 'XICH-DID-01', quantity: 8, price: 350000 },
        { name: 'Bugi NGK', sku: 'BUGI-NGK-01', quantity: 20, price: 80000 }
      ]);

      const req: any = { query: {} };
      const res = createMockRes();
      await getAllInventory(req, res);

      expect(res._body.success).toBe(true);
      expect(res._body.count).toBe(2);
      expect(res._body.data[0].name).toBe('Bugi NGK'); // Bugi NGK sorted before Xích DID
    });

    it('should filter items by search query', async () => {
      await Inventory.create([
        { name: 'Lốp Michelin 17 inch', sku: 'LOP-MIC-17', quantity: 4, price: 950000 },
        { name: 'Nhông sên DID', sku: 'NHONG-DID-02', quantity: 15, price: 420000 }
      ]);

      const req: any = { query: { search: 'michelin' } };
      const res = createMockRes();
      await getAllInventory(req, res);

      expect(res._body.count).toBe(1);
      expect(res._body.data[0].sku).toBe('LOP-MIC-17');
    });

    it('should filter items that are low in stock', async () => {
      await Inventory.create([
        { name: 'Dầu nhớt Motul 1L', sku: 'DAU-MOT-01', quantity: 12, minQuantity: 5, price: 150000 },
        { name: 'Má phanh Honda', sku: 'PHANH-HD-01', quantity: 2, minQuantity: 5, price: 90000 }
      ]);

      const req: any = { query: { lowStock: 'true' } };
      const res = createMockRes();
      await getAllInventory(req, res);

      expect(res._body.count).toBe(1);
      expect(res._body.data[0].sku).toBe('PHANH-HD-01');
    });
  });

  describe('updateInventory()', () => {
    it('should update inventory details successfully', async () => {
      const item = await Inventory.create({
        name: 'Dầu nhớt Shell',
        sku: 'DAU-SHE-01',
        quantity: 10,
        price: 130000
      });

      const req: any = {
        params: { id: item._id.toString() },
        body: {
          name: 'Dầu nhớt Shell Advance',
          price: 145000,
          location: 'Kệ C'
        }
      };
      const res = createMockRes();
      await updateInventory(req, res);

      expect(res._body.success).toBe(true);
      expect(res._body.data.name).toBe('Dầu nhớt Shell Advance');
      expect(res._body.data.price).toBe(145000);
      expect(res._body.data.location).toBe('Kệ C');
    });
  });

  describe('updateStock()', () => {
    it('should quickly import stock with positive delta', async () => {
      const item = await Inventory.create({
        name: 'Bóng đèn Philips',
        sku: 'DEN-PHI-01',
        quantity: 5,
        price: 70000
      });

      const req: any = {
        params: { id: item._id.toString() },
        body: { delta: 10 }
      };
      const res = createMockRes();
      await updateStock(req, res);

      expect(res._body.success).toBe(true);
      expect(res._body.data.quantity).toBe(15);
    });

    it('should quickly export stock with negative delta', async () => {
      const item = await Inventory.create({
        name: 'Ốp sườn Exciter',
        sku: 'OP-EX-01',
        quantity: 10,
        price: 250000
      });

      const req: any = {
        params: { id: item._id.toString() },
        body: { delta: -4 }
      };
      const res = createMockRes();
      await updateStock(req, res);

      expect(res._body.success).toBe(true);
      expect(res._body.data.quantity).toBe(6);
    });

    it('should fail to export stock if delta exceeds quantity', async () => {
      const item = await Inventory.create({
        name: 'Lọc gió Vespa',
        sku: 'LOC-VES-01',
        quantity: 2,
        price: 180000
      });

      const req: any = {
        params: { id: item._id.toString() },
        body: { delta: -5 }
      };
      const res = createMockRes();
      await updateStock(req, res);

      expect(res._status).toBe(400);
      expect(res._body.success).toBe(false);
      expect(res._body.error).toContain('vượt quá tồn kho');
    });
  });

  describe('deleteInventory()', () => {
    it('should delete inventory item successfully', async () => {
      const item = await Inventory.create({
        name: 'Gương chiếu hậu Wave',
        sku: 'GUONG-W-01',
        quantity: 20,
        price: 45000
      });

      const req: any = {
        params: { id: item._id.toString() }
      };
      const res = createMockRes();
      await deleteInventory(req, res);

      expect(res._body.success).toBe(true);
      
      const found = await Inventory.findById(item._id);
      expect(found).toBeNull();
    });
  });
});
