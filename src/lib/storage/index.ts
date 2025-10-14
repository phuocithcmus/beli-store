import type {
  Product,
  ImportPhase,
  ImportPhaseProduct,
  Transaction,
  RevenueRecord,
  StorageSchema,
} from '@/types';
import { StorageSchema as StorageValidator } from '@/lib/validations/schemas';

class LocalStorageService {
  private readonly STORAGE_KEY = 'clothing-store-data';
  private readonly VERSION = '1.0.0';

  // In-memory cache for testing
  private memoryStorage: StorageSchema | null = null;
  private isTestEnv =
    typeof window === 'undefined' ||
    (typeof global !== 'undefined' && global.process?.env?.NODE_ENV === 'test');

  /**
   * Get all data from localStorage
   */
  private getData(): StorageSchema {
    // Use in-memory storage for tests
    if (this.isTestEnv && this.memoryStorage) {
      return this.memoryStorage;
    }

    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        const defaultData = this.getDefaultData();
        if (this.isTestEnv) {
          this.memoryStorage = defaultData;
        }
        return defaultData;
      }

      const parsed = JSON.parse(data, (key, value) => {
        // Convert date strings back to Date objects
        if (key.endsWith('At') || key === 'date' || key === 'lastBackup') {
          return new Date(value);
        }
        return value;
      });

      // Validate the parsed data
      const validated = StorageValidator.parse(parsed);
      if (this.isTestEnv) {
        this.memoryStorage = validated;
      }
      return validated;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      const defaultData = this.getDefaultData();
      if (this.isTestEnv) {
        this.memoryStorage = defaultData;
      }
      return defaultData;
    }
  }

  /**
   * Save data to localStorage
   */
  private saveData(data: StorageSchema): void {
    try {
      // For tests, save to memory
      if (this.isTestEnv) {
        this.memoryStorage = data;
        this.updateMetadata();
        return;
      }

      const serialized = JSON.stringify(data, (key, value) => {
        // Convert Date objects to ISO strings
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });

      localStorage.setItem(this.STORAGE_KEY, serialized);

      // Update metadata
      this.updateMetadata();
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw new Error('Failed to save data');
    }
  }

  /**
   * Get default empty data structure
   */
  private getDefaultData(): StorageSchema {
    return {
      products: [],
      importPhases: [],
      importPhaseProducts: [],
      transactions: [],
      revenueRecords: [],
      metadata: {
        version: this.VERSION,
        lastBackup: new Date(),
        recordCounts: {
          products: 0,
          importPhases: 0,
          importPhaseProducts: 0,
          transactions: 0,
          revenueRecords: 0,
        },
      },
    };
  }

  /**
   * Update metadata with current counts
   */
  private updateMetadata(): void {
    const data = this.getData();
    data.metadata.lastBackup = new Date();
    data.metadata.recordCounts = {
      products: data.products.length,
      importPhases: data.importPhases.length,
      importPhaseProducts: data.importPhaseProducts.length,
      transactions: data.transactions.length,
      revenueRecords: data.revenueRecords.length,
    };

    // Save without triggering recursive update
    const serialized = JSON.stringify(data, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
    localStorage.setItem(this.STORAGE_KEY, serialized);
  }

  /**
   * Generate UUID
   */
  private generateId(): string {
    return crypto.randomUUID();
  }

  // Product methods
  getProducts(): Product[] {
    return this.getData().products;
  }

  getProduct(id: string): Product | undefined {
    return this.getData().products.find((p) => p.id === id);
  }

  getProductByCode(code: string): Product | undefined {
    return this.getData().products.find((p) => p.code === code);
  }

  saveProduct(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Product {
    const data = this.getData();

    // Check for duplicate code
    if (data.products.some((p) => p.code === product.code)) {
      throw new Error('Product code already exists');
    }

    const newProduct: Product = {
      ...product,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    data.products.push(newProduct);
    this.saveData(data);
    return newProduct;
  }

  updateProduct(
    id: string,
    updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
  ): Product {
    const data = this.getData();
    const index = data.products.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error('Product not found');
    }

    const updatedProduct: Product = {
      ...data.products[index],
      ...updates,
      updatedAt: new Date(),
    };

    data.products[index] = updatedProduct;
    this.saveData(data);
    return updatedProduct;
  }

  deleteProduct(id: string): boolean {
    const data = this.getData();
    const index = data.products.findIndex((p) => p.id === id);

    if (index === -1) {
      return false;
    }

    // Check if product has transactions
    const hasTransactions = data.transactions.some((t) => t.productId === id);
    if (hasTransactions) {
      throw new Error('Cannot delete product with existing transactions');
    }

    data.products.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // ImportPhase methods
  getImportPhases(): ImportPhase[] {
    return this.getData().importPhases.sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  }

  getImportPhase(id: string): ImportPhase | null {
    return this.getData().importPhases.find((ip) => ip.id === id) || null;
  }

  getImportPhaseByCode(code: string): ImportPhase | undefined {
    return this.getData().importPhases.find((ip) => ip.code === code);
  }

  saveImportPhase(
    phase: Omit<
      ImportPhase,
      'id' | 'createdAt' | 'updatedAt' | 'totalItems' | 'totalCost' | 'status'
    > & { status?: 'active' | 'completed' }
  ): ImportPhase {
    const data = this.getData();

    // Validate required fields
    if (!phase.code || phase.code.trim() === '') {
      throw new Error('Import phase code is required');
    }
    if (!phase.date) {
      throw new Error('Import phase date is required');
    }

    // Check for duplicate code
    if (data.importPhases.some((ip) => ip.code === phase.code)) {
      throw new Error(`Import phase with code ${phase.code} already exists`);
    }

    const newPhase: ImportPhase = {
      ...phase,
      id: this.generateId(),
      status: phase.status || 'active', // Default to active
      totalItems: 0,
      totalCost: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    data.importPhases.push(newPhase);
    this.saveData(data);
    return newPhase;
  }

  updateImportPhase(
    id: string,
    updates: Partial<Omit<ImportPhase, 'id' | 'createdAt' | 'updatedAt'>>
  ): ImportPhase {
    const data = this.getData();
    const index = data.importPhases.findIndex((ip) => ip.id === id);

    if (index === -1) {
      throw new Error('Import phase not found');
    }

    const phase = data.importPhases[index];

    // Check if phase is completed and prevent updates
    if (phase.status === 'completed' && updates.status !== 'completed') {
      throw new Error('Cannot update completed import phase');
    }

    // Check for duplicate code if code is being updated
    if (updates.code && updates.code !== phase.code) {
      if (
        data.importPhases.some((ip) => ip.id !== id && ip.code === updates.code)
      ) {
        throw new Error(
          `Import phase with code ${updates.code} already exists`
        );
      }
    }

    const updatedPhase: ImportPhase = {
      ...phase,
      ...updates,
      updatedAt: new Date(),
    };

    data.importPhases[index] = updatedPhase;
    this.saveData(data);
    return updatedPhase;
  }

  addProductToImportPhase(
    importPhaseId: string,
    productData: { productId: string; quantity: number; unitCost: number }
  ): ImportPhaseProduct {
    const data = this.getData();

    // Find the import phase
    const phase = data.importPhases.find((ip) => ip.id === importPhaseId);
    if (!phase) {
      throw new Error('Import phase not found');
    }

    // Check if phase is completed
    if (phase.status === 'completed') {
      throw new Error('Cannot add products to completed import phase');
    }

    // Check if product already exists in this phase
    const existingProduct = data.importPhaseProducts.find(
      (ipp) =>
        ipp.importPhaseId === importPhaseId &&
        ipp.productId === productData.productId
    );
    if (existingProduct) {
      throw new Error('Product already exists in this import phase');
    }

    // Create the import phase product
    const newProduct: ImportPhaseProduct = {
      ...productData,
      id: this.generateId(),
      importPhaseId,
      createdAt: new Date(),
    };

    data.importPhaseProducts.push(newProduct);

    // Update import phase totals
    const phaseIndex = data.importPhases.findIndex(
      (ip) => ip.id === importPhaseId
    );
    if (phaseIndex !== -1) {
      data.importPhases[phaseIndex].totalItems += productData.quantity;
      data.importPhases[phaseIndex].totalCost +=
        productData.quantity * productData.unitCost;
      data.importPhases[phaseIndex].updatedAt = new Date();
    }

    this.saveData(data);
    return newProduct;
  }

  deleteImportPhase(id: string): void {
    const data = this.getData();

    // Find the import phase
    const phase = data.importPhases.find((ip) => ip.id === id);
    if (!phase) {
      throw new Error('Import phase not found');
    }

    // Check if phase is completed (prevent deletion)
    if (phase.status === 'completed') {
      throw new Error('Cannot delete completed import phase');
    }

    // Check if phase has products
    const phaseProducts = data.importPhaseProducts.filter(
      (ipp) => ipp.importPhaseId === id
    );
    if (phaseProducts.length > 0) {
      throw new Error(
        'Cannot delete import phase with products. Remove all products first.'
      );
    }

    // Remove the import phase
    data.importPhases = data.importPhases.filter((ip) => ip.id !== id);
    this.saveData(data);
  }

  completeImportPhase(importPhaseId: string): ImportPhase {
    const data = this.getData();

    // Find the import phase
    const phaseIndex = data.importPhases.findIndex(
      (ip) => ip.id === importPhaseId
    );
    if (phaseIndex === -1) {
      throw new Error('Import phase not found');
    }

    const phase = data.importPhases[phaseIndex];

    // Check if already completed
    if (phase.status === 'completed') {
      throw new Error('Import phase is already completed');
    }

    // Check if phase has products
    const phaseProducts = data.importPhaseProducts.filter(
      (ipp) => ipp.importPhaseId === importPhaseId
    );
    if (phaseProducts.length === 0) {
      throw new Error('Cannot complete import phase with no products');
    }

    // Update product inventories and create purchase transactions
    phaseProducts.forEach((phaseProduct) => {
      // Update product inventory
      const productIndex = data.products.findIndex(
        (p) => p.id === phaseProduct.productId
      );
      if (productIndex !== -1) {
        data.products[productIndex].remainingQuantity += phaseProduct.quantity;
        data.products[productIndex].updatedAt = new Date();
      }

      // Create purchase transaction
      const transaction: Transaction = {
        id: this.generateId(),
        type: 'purchase',
        productId: phaseProduct.productId,
        quantity: phaseProduct.quantity,
        unitPrice: phaseProduct.unitCost,
        totalAmount: phaseProduct.quantity * phaseProduct.unitCost,
        date: phase.date,
        importPhaseId: importPhaseId,
        notes: `Import from phase ${phase.code}`,
        createdAt: new Date(),
      };
      data.transactions.push(transaction);
    });

    // Mark phase as completed
    data.importPhases[phaseIndex].status = 'completed';
    data.importPhases[phaseIndex].updatedAt = new Date();

    this.saveData(data);
    return data.importPhases[phaseIndex];
  }

  // ImportPhaseProduct methods
  getImportPhaseProducts(importPhaseId?: string): ImportPhaseProduct[] {
    const data = this.getData();
    if (importPhaseId) {
      return data.importPhaseProducts.filter(
        (ipp) => ipp.importPhaseId === importPhaseId
      );
    }
    return data.importPhaseProducts;
  }

  saveImportPhaseProduct(
    product: Omit<ImportPhaseProduct, 'id' | 'createdAt'>
  ): ImportPhaseProduct {
    const data = this.getData();

    const newProduct: ImportPhaseProduct = {
      ...product,
      id: this.generateId(),
      createdAt: new Date(),
    };

    data.importPhaseProducts.push(newProduct);

    // Update product inventory
    const productIndex = data.products.findIndex(
      (p) => p.id === product.productId
    );
    if (productIndex !== -1) {
      data.products[productIndex].remainingQuantity += product.quantity;
      data.products[productIndex].updatedAt = new Date();
    }

    // Update import phase totals
    const phaseIndex = data.importPhases.findIndex(
      (ip) => ip.id === product.importPhaseId
    );
    if (phaseIndex !== -1) {
      data.importPhases[phaseIndex].totalItems += product.quantity;
      data.importPhases[phaseIndex].totalCost +=
        product.quantity * product.unitCost;
      data.importPhases[phaseIndex].updatedAt = new Date();
    }

    this.saveData(data);
    return newProduct;
  }

  // Transaction methods
  getTransactions(): Transaction[] {
    return this.getData().transactions;
  }

  getTransaction(id: string): Transaction | undefined {
    return this.getData().transactions.find((t) => t.id === id);
  }

  saveTransaction(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'totalAmount'>
  ): Transaction {
    const data = this.getData();

    // Calculate total amount
    const totalAmount = transaction.quantity * transaction.unitPrice;

    const newTransaction: Transaction = {
      ...transaction,
      id: this.generateId(),
      totalAmount,
      createdAt: new Date(),
    };

    // For sales, check and update inventory
    if (transaction.type === 'sale') {
      const productIndex = data.products.findIndex(
        (p) => p.id === transaction.productId
      );
      if (productIndex === -1) {
        throw new Error('Product not found');
      }

      const product = data.products[productIndex];
      if (product.remainingQuantity < transaction.quantity) {
        throw new Error('Insufficient inventory');
      }

      data.products[productIndex].remainingQuantity -= transaction.quantity;
      data.products[productIndex].soldQuantity += transaction.quantity;
      data.products[productIndex].updatedAt = new Date();
    }

    data.transactions.push(newTransaction);
    this.saveData(data);
    return newTransaction;
  }

  updateTransaction(
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ): Transaction {
    const data = this.getData();
    const index = data.transactions.findIndex((t) => t.id === id);

    if (index === -1) {
      throw new Error('Transaction not found');
    }

    const oldTransaction = data.transactions[index];

    // Revert old transaction effects on inventory
    if (oldTransaction.type === 'sale') {
      const productIndex = data.products.findIndex(
        (p) => p.id === oldTransaction.productId
      );
      if (productIndex !== -1) {
        data.products[productIndex].remainingQuantity +=
          oldTransaction.quantity;
        data.products[productIndex].soldQuantity -= oldTransaction.quantity;
      }
    }

    // Calculate new total amount if quantity or price changed
    const newQuantity = updates.quantity ?? oldTransaction.quantity;
    const newUnitPrice = updates.unitPrice ?? oldTransaction.unitPrice;
    const totalAmount = newQuantity * newUnitPrice;

    const updatedTransaction: Transaction = {
      ...oldTransaction,
      ...updates,
      totalAmount,
    };

    // Apply new transaction effects on inventory
    if (updatedTransaction.type === 'sale') {
      const productIndex = data.products.findIndex(
        (p) => p.id === updatedTransaction.productId
      );
      if (productIndex !== -1) {
        if (
          data.products[productIndex].remainingQuantity <
          updatedTransaction.quantity
        ) {
          throw new Error('Insufficient inventory');
        }
        data.products[productIndex].remainingQuantity -=
          updatedTransaction.quantity;
        data.products[productIndex].soldQuantity += updatedTransaction.quantity;
        data.products[productIndex].updatedAt = new Date();
      }
    }

    data.transactions[index] = updatedTransaction;
    this.saveData(data);
    return updatedTransaction;
  }

  deleteTransaction(id: string): boolean {
    const data = this.getData();
    const index = data.transactions.findIndex((t) => t.id === id);

    if (index === -1) {
      return false;
    }

    const transaction = data.transactions[index];

    // Revert transaction effects on inventory
    if (transaction.type === 'sale') {
      const productIndex = data.products.findIndex(
        (p) => p.id === transaction.productId
      );
      if (productIndex !== -1) {
        data.products[productIndex].remainingQuantity += transaction.quantity;
        data.products[productIndex].soldQuantity -= transaction.quantity;
        data.products[productIndex].updatedAt = new Date();
      }
    }

    data.transactions.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // Revenue Record methods
  getRevenueRecords(): RevenueRecord[] {
    return this.getData().revenueRecords;
  }

  saveRevenueRecord(
    record: Omit<RevenueRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): RevenueRecord {
    const data = this.getData();

    // Validate required fields
    if (!record.period || record.period.trim() === '') {
      throw new Error('Revenue record period is required');
    }

    // Validate numeric fields
    if (record.totalSalesRevenue < 0 || record.totalPurchaseCosts < 0) {
      throw new Error('Revenue amounts cannot be negative');
    }

    // Check for duplicate period
    if (data.revenueRecords.some((rr) => rr.period === record.period)) {
      throw new Error(
        `Revenue record for period ${record.period} already exists`
      );
    }

    const newRecord: RevenueRecord = {
      ...record,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    data.revenueRecords.push(newRecord);
    this.saveData(data);
    return newRecord;
  }

  getRevenueRecord(id: string): RevenueRecord | null {
    return this.getData().revenueRecords.find((rr) => rr.id === id) || null;
  }

  updateRevenueRecord(
    id: string,
    updates: Partial<Omit<RevenueRecord, 'id' | 'createdAt' | 'updatedAt'>>
  ): RevenueRecord {
    const data = this.getData();
    const index = data.revenueRecords.findIndex((rr) => rr.id === id);

    if (index === -1) {
      throw new Error('Revenue record not found');
    }

    const updatedRecord: RevenueRecord = {
      ...data.revenueRecords[index],
      ...updates,
      updatedAt: new Date(),
    };

    data.revenueRecords[index] = updatedRecord;
    this.saveData(data);
    return updatedRecord;
  }

  getRevenueRecordsByDateRange(
    startDate: Date,
    endDate: Date
  ): RevenueRecord[] {
    const data = this.getData();
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    return data.revenueRecords.filter((record) => {
      return record.period >= startStr && record.period <= endStr;
    });
  }

  // Revenue calculation methods
  calculateDailyRevenue(date: Date): {
    date: Date;
    totalSalesRevenue: number;
    totalPurchaseCosts: number;
    grossProfit: number;
    profitMargin: number;
    transactionCount: number;
  } {
    const data = this.getData();
    const dateStr = date.toISOString().split('T')[0];

    const dayTransactions = data.transactions.filter((transaction) => {
      const transactionDateStr = transaction.date.toISOString().split('T')[0];
      return transactionDateStr === dateStr;
    });

    const salesTransactions = dayTransactions.filter((t) => t.type === 'sale');
    const purchaseTransactions = dayTransactions.filter(
      (t) => t.type === 'purchase'
    );

    const totalSalesRevenue = salesTransactions.reduce(
      (sum, t) => sum + t.totalAmount,
      0
    );
    const totalPurchaseCosts = purchaseTransactions.reduce(
      (sum, t) => sum + t.totalAmount,
      0
    );
    const grossProfit = totalSalesRevenue - totalPurchaseCosts;
    const profitMargin =
      totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0;

    return {
      date,
      totalSalesRevenue,
      totalPurchaseCosts,
      grossProfit,
      profitMargin: Math.round(profitMargin * 100) / 100, // Round to 2 decimal places
      transactionCount: dayTransactions.length,
    };
  }

  calculateWeeklyRevenue(startDate: Date): {
    totalSalesRevenue: number;
    totalPurchaseCosts: number;
    grossProfit: number;
    profitMargin: number;
    transactionCount: number;
  } {
    const data = this.getData();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // 7 days total

    const weekTransactions = data.transactions.filter((transaction) => {
      return transaction.date >= startDate && transaction.date <= endDate;
    });

    const salesTransactions = weekTransactions.filter((t) => t.type === 'sale');
    const purchaseTransactions = weekTransactions.filter(
      (t) => t.type === 'purchase'
    );

    const totalSalesRevenue = salesTransactions.reduce(
      (sum, t) => sum + t.totalAmount,
      0
    );
    const totalPurchaseCosts = purchaseTransactions.reduce(
      (sum, t) => sum + t.totalAmount,
      0
    );
    const grossProfit = totalSalesRevenue - totalPurchaseCosts;
    const profitMargin =
      totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0;

    return {
      totalSalesRevenue,
      totalPurchaseCosts,
      grossProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      transactionCount: weekTransactions.length,
    };
  }

  calculateMonthlyRevenue(
    year: number,
    month: number
  ): {
    totalSalesRevenue: number;
    totalPurchaseCosts: number;
    grossProfit: number;
    profitMargin: number;
    transactionCount: number;
  } {
    const data = this.getData();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    const monthTransactions = data.transactions.filter((transaction) => {
      return transaction.date >= startDate && transaction.date <= endDate;
    });

    const salesTransactions = monthTransactions.filter(
      (t) => t.type === 'sale'
    );
    const purchaseTransactions = monthTransactions.filter(
      (t) => t.type === 'purchase'
    );

    const totalSalesRevenue = salesTransactions.reduce(
      (sum, t) => sum + t.totalAmount,
      0
    );
    const totalPurchaseCosts = purchaseTransactions.reduce(
      (sum, t) => sum + t.totalAmount,
      0
    );
    const grossProfit = totalSalesRevenue - totalPurchaseCosts;
    const profitMargin =
      totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0;

    return {
      totalSalesRevenue,
      totalPurchaseCosts,
      grossProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      transactionCount: monthTransactions.length,
    };
  }

  getTopSellingProduct(date: Date): Product | null {
    const data = this.getData();
    const dateStr = date.toISOString().split('T')[0];

    const daySalesTransactions = data.transactions.filter((transaction) => {
      const transactionDateStr = transaction.date.toISOString().split('T')[0];
      return transactionDateStr === dateStr && transaction.type === 'sale';
    });

    if (daySalesTransactions.length === 0) {
      return null;
    }

    // Group by product and sum revenue
    const productRevenue: Record<string, number> = {};
    daySalesTransactions.forEach((transaction) => {
      productRevenue[transaction.productId] =
        (productRevenue[transaction.productId] || 0) + transaction.totalAmount;
    });

    // Find product with highest revenue
    let topProductId = '';
    let highestRevenue = 0;

    Object.entries(productRevenue).forEach(([productId, revenue]) => {
      if (revenue > highestRevenue) {
        highestRevenue = revenue;
        topProductId = productId;
      }
    });

    return data.products.find((p) => p.id === topProductId) || null;
  }

  calculateRevenueGrowth(previousDate: Date, currentDate: Date): number {
    const previousRevenue = this.calculateDailyRevenue(previousDate);
    const currentRevenue = this.calculateDailyRevenue(currentDate);

    if (previousRevenue.totalSalesRevenue === 0) {
      return currentRevenue.totalSalesRevenue > 0 ? 100.0 : 0;
    }

    const growth =
      ((currentRevenue.totalSalesRevenue - previousRevenue.totalSalesRevenue) /
        previousRevenue.totalSalesRevenue) *
      100;
    return Math.round(growth * 100) / 100;
  }

  // Test utility method for adding transactions without validation
  addTransactionForTesting(
    transaction: Omit<Transaction, 'id' | 'createdAt'>
  ): Transaction {
    if (!this.isTestEnv) {
      throw new Error('This method is only available in test environment');
    }

    const data = this.getData();
    const newTransaction: Transaction = {
      ...transaction,
      id: this.generateId(),
      createdAt: new Date(),
    };

    data.transactions.push(newTransaction);
    this.saveData(data);
    return newTransaction;
  }

  // Utility methods
  clearAll(): void {
    if (this.isTestEnv) {
      this.memoryStorage = null;
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  clearAllData(): void {
    if (this.isTestEnv) {
      this.memoryStorage = null;
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  exportData(): string {
    return JSON.stringify(this.getData(), null, 2);
  }

  importData(jsonData: string): void {
    try {
      const parsed = JSON.parse(jsonData, (key, value) => {
        if (key.endsWith('At') || key === 'date') {
          return new Date(value);
        }
        return value;
      });

      const validated = StorageValidator.parse(parsed);
      this.saveData(validated);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Invalid data format');
    }
  }

  getStorageInfo(): { size: number; itemCount: number } {
    const data = localStorage.getItem(this.STORAGE_KEY);
    const size = data ? data.length : 0;
    const storageData = this.getData();
    const itemCount =
      storageData.products.length +
      storageData.importPhases.length +
      storageData.importPhaseProducts.length +
      storageData.transactions.length +
      storageData.revenueRecords.length;

    return { size, itemCount };
  }

  // ============================================================================
  // DATA EXPORT METHODS
  // ============================================================================

  /**
   * Export products to CSV format
   */
  async exportProductsToCSV(filters?: {
    category?: 'shirt' | 'pants';
  }): Promise<string> {
    const products = await this.getProducts();

    // Filter products if category specified
    const filteredProducts = filters?.category
      ? products.filter((p) => p.category === filters.category)
      : products;

    // CSV headers
    const headers = [
      'Product Code',
      'Name',
      'Category',
      'Remaining Quantity',
      'Sold Quantity',
      'Purchase Price',
      'Selling Price',
      'Created At',
    ];

    // Convert products to CSV rows
    const rows = filteredProducts.map((product) => [
      product.code,
      product.name,
      product.category,
      product.remainingQuantity.toString(),
      product.soldQuantity.toString(),
      product.purchasePrice.toFixed(2),
      product.sellingPrice.toFixed(2),
      product.createdAt.toISOString(),
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Export products to JSON format
   */
  async exportProductsToJSON(filters?: {
    category?: 'shirt' | 'pants';
  }): Promise<string> {
    const products = await this.getProducts();

    // Filter products if category specified
    const filteredProducts = filters?.category
      ? products.filter((p) => p.category === filters.category)
      : products;

    return JSON.stringify(filteredProducts, null, 2);
  }

  /**
   * Export transactions to CSV format
   */
  async exportTransactionsToCSV(filters?: {
    type?: 'sale' | 'purchase';
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<string> {
    const transactions = await this.getTransactions();

    // Apply filters
    let filteredTransactions = transactions;

    if (filters?.type) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.type === filters.type
      );
    }

    if (filters?.dateFrom) {
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.date) >= filters.dateFrom!
      );
    }

    if (filters?.dateTo) {
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.date) <= filters.dateTo!
      );
    }

    // CSV headers
    const headers = [
      'Transaction ID',
      'Type',
      'Product ID',
      'Quantity',
      'Unit Price',
      'Total Amount',
      'Date',
      'Import Phase ID',
      'Notes',
    ];

    // Convert transactions to CSV rows
    const rows = filteredTransactions.map((transaction) => [
      transaction.id,
      transaction.type,
      transaction.productId,
      transaction.quantity.toString(),
      transaction.unitPrice.toFixed(2),
      transaction.totalAmount.toFixed(2),
      transaction.date.toISOString(),
      transaction.importPhaseId || '',
      transaction.notes || '',
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Export transactions to JSON format
   */
  async exportTransactionsToJSON(filters?: {
    type?: 'sale' | 'purchase';
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<string> {
    const transactions = await this.getTransactions();

    // Apply filters
    let filteredTransactions = transactions;

    if (filters?.type) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.type === filters.type
      );
    }

    if (filters?.dateFrom) {
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.date) >= filters.dateFrom!
      );
    }

    if (filters?.dateTo) {
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.date) <= filters.dateTo!
      );
    }

    return JSON.stringify(filteredTransactions, null, 2);
  }

  /**
   * Export revenue reports to CSV format
   */
  async exportRevenueReportsToCSV(): Promise<string> {
    const revenueRecords = await this.getRevenueRecords();

    // CSV headers
    const headers = [
      'Period',
      'Total Sales Revenue',
      'Total Purchase Costs',
      'Gross Profit',
      'Profit Margin',
      'Transaction Count',
      'Top Selling Product ID',
    ];

    // Convert revenue records to CSV rows
    const rows = revenueRecords.map((record) => [
      record.period,
      record.totalSalesRevenue.toFixed(2),
      record.totalPurchaseCosts.toFixed(2),
      record.grossProfit.toFixed(2),
      record.profitMargin.toFixed(2),
      record.transactionCount.toString(),
      record.topSellingProductId || '',
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Export revenue reports to JSON format
   */
  async exportRevenueReportsToJSON(): Promise<string> {
    const revenueRecords = await this.getRevenueRecords();
    return JSON.stringify(revenueRecords, null, 2);
  }

  /**
   * Export revenue summary for a date range
   */
  async exportRevenueSummary(filters: {
    dateFrom: Date;
    dateTo: Date;
  }): Promise<string> {
    const transactions = await this.getTransactions();
    const products = await this.getProducts();

    // Filter transactions by date range and type
    const salesTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.type === 'sale' &&
        transactionDate >= filters.dateFrom &&
        transactionDate <= filters.dateTo
      );
    });

    // Calculate summary metrics
    const totalRevenue = salesTransactions.reduce(
      (sum, t) => sum + t.totalAmount,
      0
    );

    const totalProfit = salesTransactions.reduce((sum, transaction) => {
      const product = products.find((p) => p.id === transaction.productId);
      if (!product) return sum;
      return (
        sum +
        (transaction.unitPrice - product.purchasePrice) * transaction.quantity
      );
    }, 0);

    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Find top products
    const productSales = new Map<
      string,
      { quantity: number; revenue: number; product: Product }
    >();

    salesTransactions.forEach((transaction) => {
      const product = products.find((p) => p.id === transaction.productId);
      if (!product) return;

      if (productSales.has(product.id)) {
        const existing = productSales.get(product.id)!;
        existing.quantity += transaction.quantity;
        existing.revenue += transaction.totalAmount;
      } else {
        productSales.set(product.id, {
          quantity: transaction.quantity,
          revenue: transaction.totalAmount,
          product,
        });
      }
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantitySold: item.quantity,
        revenue: item.revenue,
      }));

    const summary = {
      period: `${filters.dateFrom.toISOString().split('T')[0]} to ${filters.dateTo.toISOString().split('T')[0]}`,
      totalRevenue,
      totalProfit,
      profitMargin,
      transactionCount: salesTransactions.length,
      topProducts,
      generatedAt: new Date().toISOString(),
    };

    return JSON.stringify(summary, null, 2);
  }

  /**
   * Export import phases to CSV format
   */
  async exportImportPhasesToCSV(): Promise<string> {
    const importPhases = await this.getImportPhases();

    // CSV headers
    const headers = [
      'Phase Code',
      'Date',
      'Description',
      'Status',
      'Total Items',
      'Total Cost',
    ];

    // Convert import phases to CSV rows
    const rows = importPhases.map((phase) => [
      phase.code,
      phase.date.toISOString(),
      phase.description || '',
      phase.status,
      phase.totalItems.toString(),
      phase.totalCost.toFixed(2),
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Export import phases to JSON format
   */
  async exportImportPhasesToJSON(): Promise<string> {
    const importPhases = await this.getImportPhases();
    return JSON.stringify(importPhases, null, 2);
  }

  /**
   * Export complete backup of all data
   */
  async exportCompleteBackup(): Promise<string> {
    const [products, transactions, importPhases, revenueRecords] =
      await Promise.all([
        this.getProducts(),
        this.getTransactions(),
        this.getImportPhases(),
        this.getRevenueRecords(),
      ]);

    const backup = {
      version: this.VERSION,
      exportedAt: new Date().toISOString(),
      products,
      transactions,
      importPhases,
      revenueRecords,
      metadata: {
        productCount: products.length,
        transactionCount: transactions.length,
        importPhaseCount: importPhases.length,
        revenueRecordCount: revenueRecords.length,
      },
    };

    return JSON.stringify(backup, null, 2);
  }
}

// Create singleton instance
export const storageService = new LocalStorageService();
export default storageService;
