import { StorageSchema as StorageValidator } from '@/lib/validations/schemas';
import type {
  ChannelFeeStructure,
  ImportFee,
  ImportPhase,
  ImportPhaseProduct,
  Product,
  ProductVariant,
  RevenueEntry,
  RevenueRecord,
  SalesChannel,
  StorageSchema,
  Transaction,
} from '@/types';
import { DEFAULT_SALES_CHANNELS } from './defaultData';

class LocalStorageService {
  private readonly STORAGE_KEY = 'clothing-store-data';
  private readonly VERSION = '1.0.0';

  // In-memory cache for testing
  private memoryStorage: StorageSchema | null = null;
  private isTestEnv =
    typeof window === 'undefined' ||
    (typeof global !== 'undefined' && global.process?.env?.NODE_ENV === 'test');

  /**
   * Migrate data to latest schema version
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private migrateDataToLatestSchema(data: any): StorageSchema {
    // If data doesn't have the new fields, add them
    if (!data.productVariants) {
      data.productVariants = [];
    }
    if (!data.revenueEntries) {
      data.revenueEntries = [];
    }
    if (!data.salesChannels) {
      data.salesChannels = DEFAULT_SALES_CHANNELS;
    }

    // Schema v3: Add fee management system
    if (!data.importFees) {
      data.importFees = [];
    }

    // Schema v4: Add channel fee structures system
    if (!data.channelFeeStructures) {
      data.channelFeeStructures = [];
    }

    // Update metadata schema
    if (!data.metadata.schemaVersion) {
      data.metadata.schemaVersion = 4;
    } else if (data.metadata.schemaVersion < 4) {
      data.metadata.schemaVersion = 4;
    }
    if (data.metadata.variantSystemEnabled === undefined) {
      data.metadata.variantSystemEnabled = true;
    }
    if (data.metadata.feeSystemEnabled === undefined) {
      data.metadata.feeSystemEnabled = true;
    }
    if (data.metadata.channelFeeSystemEnabled === undefined) {
      data.metadata.channelFeeSystemEnabled = true;
    }

    // Migrate existing ImportPhaseProduct records to include productVariantId field
    if (data.importPhaseProducts && Array.isArray(data.importPhaseProducts)) {
      data.importPhaseProducts = data.importPhaseProducts.map(
        (ipp: Partial<ImportPhaseProduct>) => ({
          ...ipp,
          productVariantId: ipp.productVariantId || undefined, // Ensure field exists
        })
      );
    }

    // Migrate existing Transaction records to include productVariantId field
    if (data.transactions && Array.isArray(data.transactions)) {
      data.transactions = data.transactions.map((t: Partial<Transaction>) => ({
        ...t,
        productVariantId: t.productVariantId || undefined, // Ensure field exists
      }));
    }

    // Migrate existing ImportPhase records to include fee-related fields
    if (data.importPhases && Array.isArray(data.importPhases)) {
      data.importPhases = data.importPhases.map((ip: Partial<ImportPhase>) => ({
        ...ip,
        totalFees: ip.totalFees ?? 0, // Initialize to 0 if not present
        finalCost: ip.finalCost ?? (ip.totalCost || 0), // Initialize to totalCost if not present
      }));
    }

    // Fix invalid UUIDs (migrate from custom ID formats)
    if (data.revenueEntries && Array.isArray(data.revenueEntries)) {
      data.revenueEntries = data.revenueEntries.map(
        (entry: Partial<RevenueEntry>) => {
          // Check if ID is not a valid UUID (starts with rev_)
          if (
            entry.id &&
            typeof entry.id === 'string' &&
            entry.id.startsWith('rev_')
          ) {
            return { ...entry, id: crypto.randomUUID() };
          }
          return entry;
        }
      );
    }

    // Fix invalid UUIDs in transactions
    if (data.transactions && Array.isArray(data.transactions)) {
      data.transactions = data.transactions.map(
        (transaction: Partial<Transaction>) => {
          // Check if ID is not a valid UUID
          if (
            transaction.id &&
            typeof transaction.id === 'string' &&
            !this.isValidUUID(transaction.id)
          ) {
            return { ...transaction, id: crypto.randomUUID() };
          }
          return transaction;
        }
      );
    }

    // Fix invalid UUIDs in channel fee structures
    if (data.channelFeeStructures && Array.isArray(data.channelFeeStructures)) {
      data.channelFeeStructures = data.channelFeeStructures.map(
        (structure: Partial<ChannelFeeStructure>) => {
          const newStructure = { ...structure };
          // Fix structure ID
          if (
            newStructure.id &&
            typeof newStructure.id === 'string' &&
            !this.isValidUUID(newStructure.id)
          ) {
            newStructure.id = crypto.randomUUID();
          }
          // Fix sales channel ID
          if (
            newStructure.salesChannelId &&
            typeof newStructure.salesChannelId === 'string' &&
            !this.isValidUUID(newStructure.salesChannelId)
          ) {
            // Attempt to find a matching channel by name or default to a placeholder
            const channel = data.salesChannels.find(
              (c: SalesChannel) => c.name === newStructure.salesChannelId
            );
            newStructure.salesChannelId = channel
              ? channel.id
              : DEFAULT_SALES_CHANNELS[0].id; // Fallback to a default
          }
          return newStructure;
        }
      );
    }

    // Update record counts
    if (!data.metadata.recordCounts.productVariants) {
      data.metadata.recordCounts.productVariants = data.productVariants.length;
    }
    if (!data.metadata.recordCounts.revenueEntries) {
      data.metadata.recordCounts.revenueEntries = data.revenueEntries.length;
    }
    if (!data.metadata.recordCounts.salesChannels) {
      data.metadata.recordCounts.salesChannels = data.salesChannels.length;
    }
    if (!data.metadata.recordCounts.importFees) {
      data.metadata.recordCounts.importFees = data.importFees.length;
    }
    if (!data.metadata.recordCounts.channelFeeStructures) {
      data.metadata.recordCounts.channelFeeStructures =
        data.channelFeeStructures.length;
    }

    return data as StorageSchema;
  }

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
        if (
          key.endsWith('At') ||
          key === 'date' ||
          key === 'lastBackup' ||
          key === 'saleDate'
        ) {
          return new Date(value);
        }
        return value;
      });

      // Migrate data to latest schema if needed
      const migrated = this.migrateDataToLatestSchema(parsed);

      // Validate the migrated data
      const validated = StorageValidator.parse(migrated);
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
      // Enhanced entities for variants and revenue
      productVariants: [],
      revenueEntries: [],
      salesChannels: DEFAULT_SALES_CHANNELS,
      // Fee management entities
      importFees: [],
      channelFeeStructures: [],
      metadata: {
        version: this.VERSION,
        lastBackup: new Date(),
        recordCounts: {
          products: 0,
          importPhases: 0,
          importPhaseProducts: 0,
          transactions: 0,
          revenueRecords: 0,
          productVariants: 0,
          revenueEntries: 0,
          salesChannels: DEFAULT_SALES_CHANNELS.length,
          importFees: 0,
          channelFeeStructures: 0,
        },
        schemaVersion: 4, // Incremented for channel fee system
        variantSystemEnabled: true,
        feeSystemEnabled: true,
        channelFeeSystemEnabled: true,
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
      productVariants: data.productVariants.length,
      revenueEntries: data.revenueEntries.length,
      salesChannels: data.salesChannels.length,
      importFees: data.importFees.length,
      channelFeeStructures: data.channelFeeStructures.length,
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

  /**
   * Check if a string is a valid UUID
   */
  private isValidUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Force data migration - useful for ensuring existing data has latest schema
   */
  forceMigration(): void {
    const data = this.getData();
    // Force re-migration by calling migrateDataToLatestSchema
    const migrated = this.migrateDataToLatestSchema(data);
    this.saveData(migrated);
  }

  // Product methods
  getProducts(): Product[] {
    return this.getData().products;
  }

  /**
   * Get all products with their variants included
   */
  getProductsWithVariants(): (Product & { variants?: ProductVariant[] })[] {
    const data = this.getData();

    return data.products.map((product) => {
      const variants = data.productVariants.filter(
        (v) => v.productId === product.id
      );

      // Calculate variant-related fields (always calculate fresh to ensure accuracy)
      const hasVariants = variants.length > 0;
      const totalVariantInventory = variants.reduce(
        (sum, v) => sum + v.inventoryCount,
        0
      );
      const totalVariantSold = variants.reduce(
        (sum, v) => sum + v.soldCount,
        0
      );

      return {
        ...product,
        hasVariants, // Override with calculated value
        variants,
        totalVariantInventory: hasVariants ? totalVariantInventory : undefined,
        totalVariantSold: hasVariants ? totalVariantSold : undefined,
      };
    });
  }

  /**
   * Helper method to update product variant fields
   */
  private updateProductVariantFields(productId: string): void {
    const data = this.getData();
    const productIndex = data.products.findIndex((p) => p.id === productId);

    if (productIndex !== -1) {
      const variants = data.productVariants.filter(
        (v) => v.productId === productId
      );
      const hasVariants = variants.length > 0;

      data.products[productIndex].hasVariants = hasVariants;
      data.products[productIndex].updatedAt = new Date();

      // Auto-calculate product quantities from variants
      if (hasVariants) {
        const totalVariantInventory = variants.reduce(
          (sum, v) => sum + v.inventoryCount,
          0
        );
        const totalVariantSold = variants.reduce(
          (sum, v) => sum + v.soldCount,
          0
        );
        const totalVariantRemaining = variants.reduce(
          (sum, v) => sum + (v.inventoryCount - v.reservedCount - v.soldCount),
          0
        );

        // Update product quantities based on variant totals
        data.products[productIndex].totalVariantInventory =
          totalVariantInventory;
        data.products[productIndex].totalVariantSold = totalVariantSold;
        data.products[productIndex].remainingQuantity = totalVariantRemaining;
        data.products[productIndex].soldQuantity = totalVariantSold;
      } else {
        data.products[productIndex].totalVariantInventory = undefined;
        data.products[productIndex].totalVariantSold = undefined;
        // Keep original product quantities if no variants
      }

      this.saveData(data);
    }
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
      // Provide default values for optional price fields
      purchasePrice: product.purchasePrice || 0,
      sellingPrice: product.sellingPrice || undefined,
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

  /**
   * Get import phases that have available products for a specific product
   * Only returns phases where the product has remaining quantity > 0
   */
  getAvailableImportPhases(productId: string): ImportPhase[] {
    const data = this.getData();

    // First check if the product itself has remaining quantity
    const product = data.products.find((p) => p.id === productId);
    if (!product || product.remainingQuantity <= 0) {
      return [];
    }

    // Get all import phase products for the specified product
    const productImportPhases = data.importPhaseProducts.filter(
      (ipp) => ipp.productId === productId
    );

    // Get the corresponding import phases
    const availablePhaseIds = new Set(
      productImportPhases.map((ipp) => ipp.importPhaseId)
    );

    return data.importPhases
      .filter((phase) => availablePhaseIds.has(phase.id))
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date, newest first
  }

  /**
   * Get import phases with available products for any product
   * Returns phases that have at least one product with remaining quantity > 0
   */
  getAllAvailableImportPhases(): ImportPhase[] {
    const data = this.getData();

    // Get products that have remaining quantity
    const availableProductIds = new Set(
      data.products.filter((p) => p.remainingQuantity > 0).map((p) => p.id)
    );

    // Get import phases that have products with remaining quantity
    const phasesWithStock = new Set(
      data.importPhaseProducts
        .filter((ipp) => availableProductIds.has(ipp.productId))
        .map((ipp) => ipp.importPhaseId)
    );

    return data.importPhases
      .filter((phase) => phasesWithStock.has(phase.id))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
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
    productData: {
      productId: string;
      productVariantId?: string;
      quantity: number;
      unitCost: number;
    }
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

    // Check if product/variant already exists in this phase
    const existingProduct = data.importPhaseProducts.find(
      (ipp) =>
        ipp.importPhaseId === importPhaseId &&
        ipp.productId === productData.productId &&
        ipp.productVariantId === productData.productVariantId
    );
    if (existingProduct) {
      const variantText = productData.productVariantId ? ' variant' : '';
      throw new Error(
        `Product${variantText} already exists in this import phase`
      );
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

      // Update variant inventory if variant is specified
      if (phaseProduct.productVariantId) {
        const variantIndex = data.productVariants.findIndex(
          (v) => v.id === phaseProduct.productVariantId
        );
        if (variantIndex !== -1) {
          data.productVariants[variantIndex].inventoryCount +=
            phaseProduct.quantity;
          data.productVariants[variantIndex].updatedAt = new Date();
        } else {
          // This shouldn't happen if data is consistent
          throw new Error(
            `Product variant with ID ${phaseProduct.productVariantId} not found`
          );
        }
      } else {
        // Log when no variant is specified (this might be expected for products without variants)
        const product = data.products.find(
          (p) => p.id === phaseProduct.productId
        );
        if (product?.hasVariants) {
          // This could indicate a problem - a product with variants should have a variant selected
          throw new Error(
            `No variant specified for product ${product.code} which has variants. This may indicate a UI issue.`
          );
        }
      }

      // Create purchase transaction
      const transaction: Transaction = {
        id: this.generateId(),
        type: 'purchase',
        productId: phaseProduct.productId,
        productVariantId: phaseProduct.productVariantId, // Add variant tracking
        quantity: phaseProduct.quantity,
        unitPrice: phaseProduct.unitCost,
        totalAmount: phaseProduct.quantity * phaseProduct.unitCost,
        date: phase.date,
        importPhaseId,
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
      const filtered = data.importPhaseProducts.filter(
        (ipp) => ipp.importPhaseId === importPhaseId
      );
      return filtered;
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

    // Update import phase totals (but NOT inventory - that happens on completion)
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

  // Import Fee methods
  getImportFees(importPhaseId?: string): ImportFee[] {
    const data = this.getData();
    if (importPhaseId) {
      return data.importFees.filter(
        (fee) => fee.importPhaseId === importPhaseId
      );
    }
    return data.importFees;
  }

  getImportFee(id: string): ImportFee | undefined {
    return this.getData().importFees.find((fee) => fee.id === id);
  }

  saveImportFee(
    feeData: Omit<ImportFee, 'id' | 'createdAt' | 'updatedAt'>
  ): ImportFee {
    const data = this.getData();

    // Validate import phase exists
    const phase = data.importPhases.find((p) => p.id === feeData.importPhaseId);
    if (!phase) {
      throw new Error('Import phase not found');
    }

    // Check if phase is completed
    if (phase.status === 'completed') {
      throw new Error('Cannot add fees to completed import phase');
    }

    const newFee: ImportFee = {
      ...feeData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    data.importFees.push(newFee);

    // Update import phase totals
    this.recalculateImportPhaseTotals(feeData.importPhaseId, data);

    this.saveData(data);
    return newFee;
  }

  updateImportFee(
    id: string,
    updates: Partial<Omit<ImportFee, 'id' | 'importPhaseId' | 'createdAt'>>
  ): ImportFee {
    const data = this.getData();

    const feeIndex = data.importFees.findIndex((fee) => fee.id === id);
    if (feeIndex === -1) {
      throw new Error('Import fee not found');
    }

    const fee = data.importFees[feeIndex];

    // Check if import phase is completed
    const phase = data.importPhases.find((p) => p.id === fee.importPhaseId);
    if (phase?.status === 'completed') {
      throw new Error('Cannot update fees for completed import phase');
    }

    // Update the fee
    data.importFees[feeIndex] = {
      ...fee,
      ...updates,
      updatedAt: new Date(),
    };

    // Recalculate import phase totals
    this.recalculateImportPhaseTotals(fee.importPhaseId, data);

    this.saveData(data);
    return data.importFees[feeIndex];
  }

  deleteImportFee(id: string): void {
    const data = this.getData();

    const feeIndex = data.importFees.findIndex((fee) => fee.id === id);
    if (feeIndex === -1) {
      throw new Error('Import fee not found');
    }

    const fee = data.importFees[feeIndex];

    // Check if import phase is completed
    const phase = data.importPhases.find((p) => p.id === fee.importPhaseId);
    if (phase?.status === 'completed') {
      throw new Error('Cannot delete fees from completed import phase');
    }

    // Remove the fee
    data.importFees.splice(feeIndex, 1);

    // Recalculate import phase totals
    this.recalculateImportPhaseTotals(fee.importPhaseId, data);

    this.saveData(data);
  }

  /**
   * Recalculate import phase totals including fees
   * @private
   */
  private recalculateImportPhaseTotals(
    importPhaseId: string,
    data: StorageSchema
  ): void {
    const phaseIndex = data.importPhases.findIndex(
      (p) => p.id === importPhaseId
    );
    if (phaseIndex === -1) {
      return;
    }

    // Calculate total fees for this import phase
    const phaseFees = data.importFees.filter(
      (fee) => fee.importPhaseId === importPhaseId
    );
    const totalFees = phaseFees.reduce((sum, fee) => sum + fee.amount, 0);

    // Update import phase
    data.importPhases[phaseIndex].totalFees = totalFees;
    data.importPhases[phaseIndex].finalCost =
      data.importPhases[phaseIndex].totalCost + totalFees;
    data.importPhases[phaseIndex].updatedAt = new Date();
  }

  // Channel Fee Structure methods (P2 Feature)
  getChannelFeeStructures(): ChannelFeeStructure[] {
    return this.getData().channelFeeStructures.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  getChannelFeeStructure(id: string): ChannelFeeStructure | undefined {
    return this.getData().channelFeeStructures.find((cfs) => cfs.id === id);
  }

  getChannelFeeStructureByChannelId(
    channelId: string
  ): ChannelFeeStructure | undefined {
    return this.getData().channelFeeStructures.find(
      (cfs) => cfs.salesChannelId === channelId
    );
  }

  saveChannelFeeStructure(
    feeStructureData: Omit<
      ChannelFeeStructure,
      'id' | 'createdAt' | 'updatedAt'
    >
  ): ChannelFeeStructure {
    const data = this.getData();

    // If salesChannelId is not a UUID, assume it's a name and find the ID
    if (!this.isValidUUID(feeStructureData.salesChannelId)) {
      const channel = data.salesChannels.find(
        (c) => c.id === feeStructureData.salesChannelId
      );
      if (channel) {
        feeStructureData.salesChannelId = channel.id;
      } else {
        throw new Error(
          `Sales channel with name "${feeStructureData.salesChannelId}" not found.`
        );
      }
    }

    // Validate sales channel exists
    const channel = data.salesChannels.find(
      (c) => c.id === feeStructureData.salesChannelId
    );
    if (!channel) {
      throw new Error('Sales channel not found');
    }

    // Check for duplicate channel fee structure
    const existingStructure = data.channelFeeStructures.find(
      (cfs) => cfs.salesChannelId === feeStructureData.salesChannelId
    );
    if (existingStructure) {
      throw new Error(
        `Channel fee structure already exists for channel ${channel.name}`
      );
    }

    const newChannelFeeStructure: ChannelFeeStructure = {
      ...feeStructureData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    data.channelFeeStructures.push(newChannelFeeStructure);
    this.saveData(data);
    return newChannelFeeStructure;
  }

  updateChannelFeeStructure(
    id: string,
    updates: Partial<
      Omit<ChannelFeeStructure, 'id' | 'salesChannelId' | 'createdAt'>
    >
  ): ChannelFeeStructure {
    const data = this.getData();

    const structureIndex = data.channelFeeStructures.findIndex(
      (cfs) => cfs.id === id
    );
    if (structureIndex === -1) {
      throw new Error('Channel fee structure not found');
    }

    // Update the channel fee structure
    data.channelFeeStructures[structureIndex] = {
      ...data.channelFeeStructures[structureIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.saveData(data);
    return data.channelFeeStructures[structureIndex];
  }

  deleteChannelFeeStructure(id: string): void {
    const data = this.getData();

    const structureIndex = data.channelFeeStructures.findIndex(
      (cfs) => cfs.id === id
    );
    if (structureIndex === -1) {
      throw new Error('Channel fee structure not found');
    }

    // Remove the channel fee structure
    data.channelFeeStructures.splice(structureIndex, 1);
    this.saveData(data);
  }

  /**
   * Calculate fee amount for a revenue entry based on channel fee structure
   * @param channelId - Sales channel ID
   * @param revenueAmount - Revenue amount to calculate fee for
   * @returns Calculated fee amount or 0 if no fee structure exists
   */
  calculateChannelFee(channelId: string, revenueAmount: number): number {
    const feeStructure = this.getChannelFeeStructureByChannelId(channelId);
    if (!feeStructure) {
      return 0;
    }

    let calculatedFee = 0;

    // Calculate percentage fee
    if (feeStructure.percentageRate > 0) {
      calculatedFee += (revenueAmount * feeStructure.percentageRate) / 100;
    }

    // Add fixed fee
    if (feeStructure.fixedFee > 0) {
      calculatedFee += feeStructure.fixedFee;
    }

    // Apply minimum fee constraint
    if (feeStructure.minimumFee && calculatedFee < feeStructure.minimumFee) {
      calculatedFee = feeStructure.minimumFee;
    }

    // Apply maximum fee constraint
    if (feeStructure.maximumFee && calculatedFee > feeStructure.maximumFee) {
      calculatedFee = feeStructure.maximumFee;
    }

    return Math.round(calculatedFee); // Round to nearest VND
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
  // PRODUCT VARIANT METHODS
  // ============================================================================

  /**
   * Get all product variants
   */
  getProductVariants(): ProductVariant[] {
    return this.getData().productVariants;
  }

  /**
   * Get product variant by ID
   */
  getProductVariant(id: string): ProductVariant | undefined {
    return this.getData().productVariants.find((v) => v.id === id);
  }

  /**
   * Get variants for a specific product
   */
  getProductVariantsByProduct(productId: string): ProductVariant[] {
    return this.getData().productVariants.filter(
      (v) => v.productId === productId
    );
  }

  /**
   * Get variant by SKU
   */
  getProductVariantBySKU(sku: string): ProductVariant | undefined {
    return this.getData().productVariants.filter((v) => v.sku === sku)[0];
  }

  /**
   * Save new product variant
   */
  saveProductVariant(
    variant: Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>
  ): ProductVariant {
    const data = this.getData();

    // Validate required fields
    if (!variant.sku || variant.sku.trim() === '') {
      throw new Error('SKU is required');
    }

    // Validate inventory counts
    if (variant.inventoryCount < 0) {
      throw new Error('Inventory count cannot be negative');
    }
    if (variant.reservedCount < 0) {
      throw new Error('Reserved count cannot be negative');
    }
    if (variant.soldCount < 0) {
      throw new Error('Sold count cannot be negative');
    }

    // Check for duplicate SKU
    if (data.productVariants.some((v) => v.sku === variant.sku)) {
      throw new Error('SKU already exists');
    }

    const newVariant: ProductVariant = {
      ...variant,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    data.productVariants.push(newVariant);

    // Update parent product variant fields
    this.updateProductVariantFields(variant.productId);

    this.saveData(data);
    return newVariant;
  }

  /**
   * Update product variant
   */
  updateProductVariant(
    id: string,
    updates: Partial<Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>>
  ): ProductVariant {
    const data = this.getData();
    const index = data.productVariants.findIndex((v) => v.id === id);

    if (index === -1) {
      throw new Error('Product variant not found');
    }

    // Add a small delay to ensure timestamp difference in tests
    const now = new Date();

    const updatedVariant: ProductVariant = {
      ...data.productVariants[index],
      ...updates,
      updatedAt: now,
    };

    data.productVariants[index] = updatedVariant;

    // Update parent product variant fields
    this.updateProductVariantFields(updatedVariant.productId);

    this.saveData(data);
    return updatedVariant;
  }

  /**
   * Delete product variant
   */
  deleteProductVariant(id: string): boolean {
    const data = this.getData();
    const index = data.productVariants.findIndex((v) => v.id === id);

    if (index === -1) {
      return false;
    }

    const variant = data.productVariants[index];
    const productId = variant.productId;

    data.productVariants.splice(index, 1);

    // Update parent product variant fields
    this.updateProductVariantFields(productId);

    this.saveData(data);
    return true;
  }

  // ============================================================================
  // REVENUE ENTRY METHODS
  // ============================================================================

  /**
   * Get all revenue entries
   */
  getRevenueEntries(): RevenueEntry[] {
    return this.getData().revenueEntries;
  }

  /**
   * Get revenue entry by ID
   */
  getRevenueEntry(id: string): RevenueEntry | undefined {
    return this.getData().revenueEntries.find((r) => r.id === id);
  }

  /**
   * Get revenue entries by date range
   */
  getRevenueEntriesByDateRange(startDate: Date, endDate: Date): RevenueEntry[] {
    return this.getData().revenueEntries.filter(
      (r) => r.saleDate >= startDate && r.saleDate <= endDate
    );
  }

  /**
   * Get revenue entries by sales channel
   */
  getRevenueEntriesBySalesChannel(salesChannel: string): RevenueEntry[] {
    return this.getData().revenueEntries.filter(
      (r) => r.salesChannel === salesChannel
    );
  }

  /**
   * Save new revenue entry
   */
  saveRevenueEntry(
    entry: Omit<RevenueEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): RevenueEntry {
    const data = this.getData();

    const newEntry: RevenueEntry = {
      ...entry,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    data.revenueEntries.push(newEntry);
    this.saveData(data);
    return newEntry;
  }

  /**
   * Update revenue entry
   */
  updateRevenueEntry(
    id: string,
    updates: Partial<Omit<RevenueEntry, 'id' | 'createdAt' | 'updatedAt'>>
  ): RevenueEntry {
    const data = this.getData();
    const index = data.revenueEntries.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error('Revenue entry not found');
    }

    const updatedEntry: RevenueEntry = {
      ...data.revenueEntries[index],
      ...updates,
      updatedAt: new Date(),
    };

    data.revenueEntries[index] = updatedEntry;
    this.saveData(data);
    return updatedEntry;
  }

  /**
   * Delete revenue entry
   */
  deleteRevenueEntry(id: string): boolean {
    const data = this.getData();
    const index = data.revenueEntries.findIndex((r) => r.id === id);

    if (index === -1) {
      return false;
    }

    data.revenueEntries.splice(index, 1);
    this.saveData(data);
    return true;
  }

  /**
   * Get import phase cost for a product
   * Returns the unit cost from the import phase product
   */
  getImportPhaseProductCost(
    importPhaseId: string,
    productId: string
  ): number | null {
    const data = this.getData();

    const importPhaseProduct = data.importPhaseProducts.find(
      (ipp) =>
        ipp.importPhaseId === importPhaseId && ipp.productId === productId
    );

    return importPhaseProduct ? importPhaseProduct.unitCost : null;
  }

  /**
   * Get full import phase cost for a product including proportional fees
   * Returns the unit cost plus allocated fees (shipping, customs, etc.)
   */
  getImportPhaseProductFullCost(
    importPhaseId: string,
    productId: string
  ): number | null {
    const data = this.getData();

    const importPhaseProduct = data.importPhaseProducts.find(
      (ipp) =>
        ipp.importPhaseId === importPhaseId && ipp.productId === productId
    );

    if (!importPhaseProduct) {
      return null;
    }

    const baseCost = importPhaseProduct.unitCost;

    // Get all fees for this import phase
    const phaseFees = this.getImportFees(importPhaseId);
    const totalFees = phaseFees.reduce((sum, fee) => sum + fee.amount, 0);

    if (totalFees === 0) {
      return baseCost; // No fees to allocate
    }

    // Get all products in this import phase to calculate proportional allocation
    const allPhaseProducts = data.importPhaseProducts.filter(
      (ipp) => ipp.importPhaseId === importPhaseId
    );

    // Calculate total value of all products in the phase (quantity * unitCost)
    const totalPhaseValue = allPhaseProducts.reduce(
      (sum, ipp) => sum + ipp.quantity * ipp.unitCost,
      0
    );

    if (totalPhaseValue === 0) {
      return baseCost; // Avoid division by zero
    }

    // Calculate this product's value in the phase
    const productValue =
      importPhaseProduct.quantity * importPhaseProduct.unitCost;

    // Allocate fees proportionally based on product value
    const feeAllocationRatio = productValue / totalPhaseValue;
    const allocatedFees = totalFees * feeAllocationRatio;

    // Calculate per-unit allocated fee
    const feePerUnit = allocatedFees / importPhaseProduct.quantity;

    return baseCost + feePerUnit;
  }

  /**
   * Get detailed cost breakdown for a product in an import phase
   * Returns base cost, allocated fees, and total cost per unit
   */
  getImportPhaseProductCostBreakdown(
    importPhaseId: string,
    productId: string
  ): {
    baseCost: number;
    allocatedFees: number;
    totalCost: number;
    feeBreakdown: {
      type: string;
      name: string;
      amount: number;
      allocatedAmount: number;
    }[];
  } | null {
    const data = this.getData();

    const importPhaseProduct = data.importPhaseProducts.find(
      (ipp) =>
        ipp.importPhaseId === importPhaseId && ipp.productId === productId
    );

    if (!importPhaseProduct) {
      return null;
    }

    const baseCost = importPhaseProduct.unitCost;

    // Get all fees for this import phase
    const phaseFees = this.getImportFees(importPhaseId);

    if (phaseFees.length === 0) {
      return {
        baseCost,
        allocatedFees: 0,
        totalCost: baseCost,
        feeBreakdown: [],
      };
    }

    // Get all products in this import phase to calculate proportional allocation
    const allPhaseProducts = data.importPhaseProducts.filter(
      (ipp) => ipp.importPhaseId === importPhaseId
    );

    // Calculate total value of all products in the phase (quantity * unitCost)
    const totalPhaseValue = allPhaseProducts.reduce(
      (sum, ipp) => sum + ipp.quantity * ipp.unitCost,
      0
    );

    if (totalPhaseValue === 0) {
      return {
        baseCost,
        allocatedFees: 0,
        totalCost: baseCost,
        feeBreakdown: [],
      };
    }

    // Calculate this product's value in the phase
    const productValue =
      importPhaseProduct.quantity * importPhaseProduct.unitCost;
    const feeAllocationRatio = productValue / totalPhaseValue;

    // Create detailed fee breakdown
    const feeBreakdown = phaseFees.map((fee) => {
      const allocatedAmount =
        (fee.amount * feeAllocationRatio) / importPhaseProduct.quantity;
      return {
        type: fee.type,
        name: fee.name,
        amount: fee.amount,
        allocatedAmount,
      };
    });

    const totalAllocatedFees = feeBreakdown.reduce(
      (sum, fee) => sum + fee.allocatedAmount,
      0
    );

    return {
      baseCost,
      allocatedFees: totalAllocatedFees,
      totalCost: baseCost + totalAllocatedFees,
      feeBreakdown,
    };
  }

  /**
   * Calculate profit for a revenue entry based on import phase
   */
  calculateRevenueEntryProfit(revenueEntry: RevenueEntry): {
    profit: number;
    profitMargin: number;
    costPrice: number | null;
    hasImportPhaseData: boolean;
  } {
    if (!revenueEntry.importPhaseId) {
      return {
        profit: 0,
        profitMargin: 0,
        costPrice: null,
        hasImportPhaseData: false,
      };
    }

    // Use full cost calculation including fees instead of base cost only
    const costPrice = this.getImportPhaseProductFullCost(
      revenueEntry.importPhaseId,
      revenueEntry.productId
    );

    if (costPrice === null) {
      return {
        profit: 0,
        profitMargin: 0,
        costPrice: null,
        hasImportPhaseData: false,
      };
    }

    const totalCost = costPrice * revenueEntry.quantity;
    const totalRevenue = revenueEntry.amount;
    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return {
      profit,
      profitMargin,
      costPrice,
      hasImportPhaseData: true,
    };
  }

  /**
   * Get profit data for multiple revenue entries
   */
  calculateMultipleRevenueEntriesProfit(revenueEntries: RevenueEntry[]): {
    revenueEntryId: string;
    profit: number;
    profitMargin: number;
    costPrice: number | null;
    hasImportPhaseData: boolean;
  }[] {
    return revenueEntries.map((entry) => ({
      revenueEntryId: entry.id,
      ...this.calculateRevenueEntryProfit(entry),
    }));
  }

  // ============================================================================
  // ENHANCED FEE CALCULATION METHODS
  // ============================================================================

  /**
   * Get comprehensive import fee summary for an import phase
   * Returns detailed breakdown of all fees and their allocation
   */
  getImportPhaseFeesSummary(importPhaseId: string): {
    totalFees: number;
    feesByType: Record<string, number>;
    averageFeePercentage: number;
    phaseTotalCost: number;
    finalCost: number;
    fees: ImportFee[];
  } {
    const data = this.getData();

    const phase = data.importPhases.find((p) => p.id === importPhaseId);
    if (!phase) {
      throw new Error('Import phase not found');
    }

    const fees = this.getImportFees(importPhaseId);
    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);

    // Group fees by type
    const feesByType: Record<string, number> = {};
    fees.forEach((fee) => {
      const type = fee.type || 'other';
      feesByType[type] = (feesByType[type] || 0) + fee.amount;
    });

    // Calculate average fee percentage relative to phase cost
    const averageFeePercentage =
      phase.totalCost > 0 ? (totalFees / phase.totalCost) * 100 : 0;

    return {
      totalFees: Math.round(totalFees),
      feesByType,
      averageFeePercentage: Math.round(averageFeePercentage * 100) / 100,
      phaseTotalCost: phase.totalCost,
      finalCost: phase.finalCost || phase.totalCost + totalFees,
      fees,
    };
  }

  /**
   * Get aggregated fee statistics across all import phases
   */
  getAllImportFeesStatistics(): {
    totalImportFees: number;
    feesByType: Record<string, number>;
    averageFeePerPhase: number;
    totalPhases: number;
  } {
    const data = this.getData();
    const allFees = data.importFees;
    const totalFees = allFees.reduce((sum, fee) => sum + fee.amount, 0);

    // Group by type
    const feesByType: Record<string, number> = {};
    allFees.forEach((fee) => {
      const type = fee.type || 'other';
      feesByType[type] = (feesByType[type] || 0) + fee.amount;
    });

    // Calculate average fees per phase
    const phasesWithFees = new Set(allFees.map((fee) => fee.importPhaseId));
    const averageFeePerPhase =
      phasesWithFees.size > 0 ? totalFees / phasesWithFees.size : 0;

    return {
      totalImportFees: Math.round(totalFees),
      feesByType,
      averageFeePerPhase: Math.round(averageFeePerPhase),
      totalPhases: phasesWithFees.size,
    };
  }

  /**
   * Calculate the impact of fees on product cost for a specific product
   */
  calculateFeeImpactOnProduct(productId: string): {
    productCode: string;
    productName: string;
    totalImportFees: number;
    averageFeePerUnit: number;
    feePercentageOfCost: number;
    importPhases: {
      phaseId: string;
      phaseCode: string;
      baseCost: number;
      allocatedFees: number;
      totalCost: number;
      quantity: number;
    }[];
  } | null {
    const data = this.getData();

    const product = data.products.find((p) => p.id === productId);
    if (!product) {
      return null;
    }

    // Find all import phases for this product
    const productImportPhases = data.importPhaseProducts.filter(
      (ipp) => ipp.productId === productId
    );

    if (productImportPhases.length === 0) {
      return {
        productCode: product.code,
        productName: product.name,
        totalImportFees: 0,
        averageFeePerUnit: 0,
        feePercentageOfCost: 0,
        importPhases: [],
      };
    }

    let totalImportFees = 0;
    let totalBaseCost = 0;
    let totalQuantity = 0;

    const importPhases = productImportPhases.map((ipp) => {
      const phase = data.importPhases.find((p) => p.id === ipp.importPhaseId);
      const costBreakdown = this.getImportPhaseProductCostBreakdown(
        ipp.importPhaseId,
        productId
      );

      const baseCost = ipp.unitCost * ipp.quantity;
      const allocatedFees = costBreakdown?.allocatedFees
        ? costBreakdown.allocatedFees * ipp.quantity
        : 0;
      const totalCost = baseCost + allocatedFees;

      totalImportFees += allocatedFees;
      totalBaseCost += baseCost;
      totalQuantity += ipp.quantity;

      return {
        phaseId: ipp.importPhaseId,
        phaseCode: phase?.code || 'Unknown',
        baseCost: Math.round(baseCost),
        allocatedFees: Math.round(allocatedFees),
        totalCost: Math.round(totalCost),
        quantity: ipp.quantity,
      };
    });

    const averageFeePerUnit =
      totalQuantity > 0 ? totalImportFees / totalQuantity : 0;
    const feePercentageOfCost =
      totalBaseCost > 0 ? (totalImportFees / totalBaseCost) * 100 : 0;

    return {
      productCode: product.code,
      productName: product.name,
      totalImportFees: Math.round(totalImportFees),
      averageFeePerUnit: Math.round(averageFeePerUnit),
      feePercentageOfCost: Math.round(feePercentageOfCost * 100) / 100,
      importPhases,
    };
  }

  /**
   * Get fee optimization suggestions for import phases
   */
  getFeeOptimizationSuggestions(): {
    type: 'high_fee_percentage' | 'duplicate_supplier' | 'missing_category';
    message: string;
    importPhaseId?: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }[] {
    const data = this.getData();
    const suggestions = [];

    // Check for import phases with high fee percentages
    for (const phase of data.importPhases) {
      if (phase.totalCost > 0 && phase.totalFees > 0) {
        const feePercentage = (phase.totalFees / phase.totalCost) * 100;
        if (feePercentage > 30) {
          suggestions.push({
            type: 'high_fee_percentage' as const,
            message: `Import phase ${phase.code} has high fees (${Math.round(feePercentage)}% of cost)`,
            importPhaseId: phase.id,
            suggestion:
              'Review fee structure and negotiate better rates with suppliers',
            priority: 'high' as const,
          });
        }
      }
    }

    // Check for fees without proper categorization
    const feesWithoutCategory = data.importFees.filter(
      (fee) => !fee.type || fee.type === 'other'
    );
    if (feesWithoutCategory.length > 0) {
      suggestions.push({
        type: 'missing_category' as const,
        message: `${feesWithoutCategory.length} fees are not properly categorized`,
        suggestion: 'Categorize fees for better tracking and analysis',
        priority: 'medium' as const,
      });
    }

    // Group fees by type to identify optimization opportunities
    const typeFees: Record<string, ImportFee[]> = {};
    data.importFees.forEach((fee) => {
      const type = fee.type || 'other';
      if (!typeFees[type]) {
        typeFees[type] = [];
      }
      typeFees[type].push(fee);
    });

    // Check for types with many fees (potential for consolidation)
    Object.entries(typeFees).forEach(([type, fees]) => {
      if (fees.length > 5) {
        const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
        suggestions.push({
          type: 'missing_category' as const,
          message: `${type} fees appear ${fees.length} times totaling ${Math.round(totalAmount)} VND`,
          suggestion: `Consider consolidating ${type} fees or negotiating bulk rates`,
          priority: 'medium' as const,
        });
      }
    });

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // ============================================================================
  // SALES CHANNEL METHODS
  // ============================================================================

  /**
   * Get all sales channels
   */
  getSalesChannels(): SalesChannel[] {
    return this.getData().salesChannels;
  }

  /**
   * Get active sales channels
   */
  getActiveSalesChannels(): SalesChannel[] {
    return this.getData().salesChannels.filter((c) => c.isActive);
  }

  /**
   * Get sales channel by ID
   */
  getSalesChannel(id: string): SalesChannel | undefined {
    return this.getData().salesChannels.find((c) => c.id === id);
  }

  /**
   * Save new sales channel
   */
  saveSalesChannel(channel: SalesChannel): SalesChannel {
    const data = this.getData();

    // Check for duplicate ID
    if (data.salesChannels.some((c) => c.id === channel.id)) {
      throw new Error('Sales channel ID already exists');
    }

    data.salesChannels.push(channel);
    this.saveData(data);
    return channel;
  }

  /**
   * Update sales channel
   */
  updateSalesChannel(
    id: string,
    updates: Partial<Omit<SalesChannel, 'id'>>
  ): SalesChannel {
    const data = this.getData();
    const index = data.salesChannels.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error('Sales channel not found');
    }

    const updatedChannel: SalesChannel = {
      ...data.salesChannels[index],
      ...updates,
    };

    data.salesChannels[index] = updatedChannel;
    this.saveData(data);
    return updatedChannel;
  }

  /**
   * Delete sales channel
   */
  deleteSalesChannel(id: string): boolean {
    const data = this.getData();
    const index = data.salesChannels.findIndex((c) => c.id === id);

    if (index === -1) {
      return false;
    }

    data.salesChannels.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // ============================================================================
  // DEBUG METHODS (temporary)
  // ============================================================================

  /**
   * Debug method to check products and variants
   */
  debugProductsAndVariants(): void {
    const data = this.getData();
    /* eslint-disable no-console */
    console.log('=== DEBUG: Products and Variants ===');
    console.log('Products:', data.products.length);
    data.products.forEach((product) => {
      console.log(`Product ${product.code}:`, {
        id: product.id,
        hasVariants: product.hasVariants,
        variantCount: data.productVariants.filter(
          (v) => v.productId === product.id
        ).length,
      });
    });
    console.log('Product Variants:', data.productVariants.length);
    data.productVariants.forEach((variant) => {
      console.log(`Variant ${variant.sku}:`, {
        id: variant.id,
        productId: variant.productId,
        color: variant.color,
        size: variant.size,
        form: variant.form,
      });
    });
    console.log('Import Phase Products:', data.importPhaseProducts.length);
    data.importPhaseProducts.forEach((ipp) => {
      console.log(`Import Phase Product:`, {
        id: ipp.id,
        productId: ipp.productId,
        productVariantId: ipp.productVariantId,
        quantity: ipp.quantity,
      });
    });
    console.log('===================================');
    /* eslint-enable no-console */
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
      (product.purchasePrice || 0).toFixed(2),
      product.sellingPrice?.toFixed(2) || 'Not set',
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
      .map((row) => row.join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Export revenue entries with import phase and profit data to CSV format
   */
  async exportRevenueEntriesWithProfitToCSV(): Promise<string> {
    const data = this.getData();
    const revenueEntries = data.revenueEntries;

    // Enhanced CSV headers including import phase and profit data
    const headers = [
      'Date',
      'Product Name',
      'Variant Details',
      'Quantity',
      'Unit Price',
      'Total Amount',
      'Sales Channel',
      'Channel Fee',
      'Net Amount',
      'Import Phase Code',
      'Import Date',
      'Import Cost Per Unit',
      'Total Import Cost',
      'Gross Profit',
      'Profit Margin (%)',
      'Notes',
    ];

    // Convert revenue entries to CSV rows with profit calculations
    const rows = revenueEntries.map((entry) => {
      let importPhaseCode = '';
      let importDate = '';
      let importCostPerUnit = '';
      let totalImportCost = '';
      let grossProfit = '';
      let profitMargin = '';

      // Get import phase and profit data if available
      if (entry.importPhaseId) {
        const importPhase = data.importPhases.find(
          (ip) => ip.id === entry.importPhaseId
        );
        if (importPhase) {
          importPhaseCode = importPhase.code;
          importDate = importPhase.date.toISOString().split('T')[0];

          try {
            const profitData = this.calculateRevenueEntryProfit(entry);
            if (profitData && profitData.costPrice !== null) {
              importCostPerUnit = profitData.costPrice.toFixed(2);
              totalImportCost = (profitData.costPrice * entry.quantity).toFixed(
                2
              );
              grossProfit = profitData.profit.toFixed(2);
              profitMargin = profitData.profitMargin.toFixed(2);
            }
          } catch (error) {
            // Silent error handling - skip profit calculation for this entry
          }
        }
      }

      return [
        entry.saleDate.toISOString().split('T')[0],
        entry.productName,
        entry.variantDetails || '',
        entry.quantity.toString(),
        entry.unitPrice.toFixed(2),
        entry.amount.toFixed(2),
        entry.salesChannelName,
        (entry.channelFee || 0).toFixed(2),
        (entry.netAmount || entry.amount).toFixed(2),
        importPhaseCode,
        importDate,
        importCostPerUnit,
        totalImportCost,
        grossProfit,
        profitMargin,
        entry.notes || '',
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Export revenue entries with import phase and profit data to JSON format
   */
  async exportRevenueEntriesWithProfitToJSON(): Promise<string> {
    const data = this.getData();
    const revenueEntries = data.revenueEntries;

    // Transform revenue entries with enhanced profit data
    const enrichedEntries = revenueEntries.map((entry) => {
      const baseEntry = {
        id: entry.id,
        date: entry.saleDate.toISOString().split('T')[0],
        productName: entry.productName,
        variantDetails: entry.variantDetails || null,
        quantity: entry.quantity,
        unitPrice: entry.unitPrice,
        totalAmount: entry.amount,
        salesChannel: entry.salesChannelName,
        channelFee: entry.channelFee || 0,
        netAmount: entry.netAmount || entry.amount,
        notes: entry.notes || null,
      };

      // Add import phase and profit data if available
      if (entry.importPhaseId) {
        const importPhase = data.importPhases.find(
          (ip) => ip.id === entry.importPhaseId
        );
        if (importPhase) {
          try {
            const profitData = this.calculateRevenueEntryProfit(entry);
            return {
              ...baseEntry,
              importPhase: {
                id: importPhase.id,
                code: importPhase.code,
                date: importPhase.date.toISOString().split('T')[0],
                description: importPhase.description || null,
              },
              profitAnalysis:
                profitData && profitData.costPrice !== null
                  ? {
                      importCostPerUnit: profitData.costPrice,
                      totalImportCost: profitData.costPrice * entry.quantity,
                      grossProfit: profitData.profit,
                      profitMargin: profitData.profitMargin,
                      hasImportPhaseData: profitData.hasImportPhaseData,
                    }
                  : null,
            };
          } catch (error) {
            // Silent error handling for export
          }
        }
      }

      return {
        ...baseEntry,
        importPhase: null,
        profitAnalysis: null,
      };
    });

    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalEntries: enrichedEntries.length,
        entriesWithProfitData: enrichedEntries.filter(
          (e) => e.profitAnalysis !== null
        ).length,
        data: enrichedEntries,
      },
      null,
      2
    );
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
      if (!product) {
        return sum;
      }
      return (
        sum +
        (transaction.unitPrice - (product.purchasePrice || 0)) *
          transaction.quantity
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
      if (!product) {
        return;
      }

      if (productSales.has(product.id)) {
        const existing = productSales.get(product.id);
        if (existing) {
          existing.quantity += transaction.quantity;
          existing.revenue += transaction.totalAmount;
        }
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
