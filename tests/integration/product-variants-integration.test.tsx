/**
 * Integration Test for Product Variants Feature
 * Tests the complete flow from product pages to variant management
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductsPage from '@/app/(dashboard)/products/page';
import ProductDetailPage from '@/app/(dashboard)/products/[id]/page';
import VariantsPage from '@/app/(dashboard)/variants/page';
import { storageService } from '@/lib/storage';
import type { Product, ProductVariant } from '@/types';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useParams: () => ({ id: 'test-product-1' }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock storage service
jest.mock('@/lib/storage');
const mockStorageService = storageService as jest.Mocked<typeof storageService>;

const mockProduct: Product = {
  id: 'test-product-1',
  name: 'Test Product',
  code: 'TEST001',
  purchasePrice: 50,
  sellingPrice: 100,
  category: 'clothing',
  supplier: 'Test Supplier',
  description: 'Test Description',
  status: 'active',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockVariants: ProductVariant[] = [
  {
    id: 'variant-1',
    productId: 'test-product-1',
    sku: 'TEST001-RED-M',
    color: 'Red',
    size: 'M',
    form: 'Cotton',
    inventoryCount: 50,
    reservedCount: 5,
    soldCount: 10,
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'variant-2',
    productId: 'test-product-1',
    sku: 'TEST001-BLUE-L',
    color: 'Blue',
    size: 'L',
    form: 'Cotton',
    inventoryCount: 30,
    reservedCount: 2,
    soldCount: 8,
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

describe('Product Variants Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageService.getProducts.mockResolvedValue([mockProduct]);
    mockStorageService.getProductVariants.mockResolvedValue(mockVariants);
    mockStorageService.getVariantsByProductId.mockResolvedValue(mockVariants);
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  describe('Products Page Navigation', () => {
    it('should navigate to product detail when clicking view product', async () => {
      renderWithRouter(<ProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      const viewButton = screen.getByText('View Product');
      fireEvent.click(viewButton);

      expect(mockPush).toHaveBeenCalledWith('/products/test-product-1');
    });

    it('should display product variants summary in product list', async () => {
      renderWithRouter(<ProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Should show variant count
      expect(screen.getByText('2 variants')).toBeInTheDocument();

      // Should show stock information
      expect(screen.getByText('55 available')).toBeInTheDocument();
    });
  });

  describe('Product Detail Page', () => {
    it('should display product information and variant manager', async () => {
      renderWithRouter(<ProductDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Should display product details
      expect(screen.getByText('TEST001')).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();

      // Should display variant statistics
      expect(screen.getByText('Total Variants')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();

      expect(screen.getByText('Total Inventory')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();

      expect(screen.getByText('Available Stock')).toBeInTheDocument();
      expect(screen.getByText('55')).toBeInTheDocument();
    });

    it('should display variant cards for each variant', async () => {
      renderWithRouter(<ProductDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('TEST001-RED-M')).toBeInTheDocument();
        expect(screen.getByText('TEST001-BLUE-L')).toBeInTheDocument();
      });

      // Should show variant details
      expect(screen.getByText('Red • M • Cotton')).toBeInTheDocument();
      expect(screen.getByText('Blue • L • Cotton')).toBeInTheDocument();

      // Should show inventory information
      expect(screen.getByText('35 available')).toBeInTheDocument(); // 50 - 5 - 10
      expect(screen.getByText('20 available')).toBeInTheDocument(); // 30 - 2 - 8
    });

    it('should allow creating new variants', async () => {
      renderWithRouter(<ProductDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Add Variant')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Variant');
      fireEvent.click(addButton);

      // Should open create variant dialog
      expect(screen.getByText('Create Product Variant')).toBeInTheDocument();
    });
  });

  describe('Variants Page', () => {
    it('should display all variants across all products', async () => {
      renderWithRouter(<VariantsPage />);

      await waitFor(() => {
        expect(screen.getByText('Product Variants')).toBeInTheDocument();
      });

      // Should display summary statistics
      expect(screen.getByText('Total Variants')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();

      expect(screen.getByText('Available Stock')).toBeInTheDocument();
      expect(screen.getByText('55')).toBeInTheDocument();

      // Should display variant cards
      expect(screen.getByText('TEST001-RED-M')).toBeInTheDocument();
      expect(screen.getByText('TEST001-BLUE-L')).toBeInTheDocument();
    });

    it('should allow filtering variants by stock status', async () => {
      renderWithRouter(<VariantsPage />);

      await waitFor(() => {
        expect(screen.getByText('Product Variants')).toBeInTheDocument();
      });

      // Initially should show all variants
      expect(screen.getByText('TEST001-RED-M')).toBeInTheDocument();
      expect(screen.getByText('TEST001-BLUE-L')).toBeInTheDocument();

      // Filter by in-stock
      const filterSelect = screen.getByDisplayValue('All Stock');
      fireEvent.click(filterSelect);
      fireEvent.click(screen.getByText('In Stock'));

      // Should still show variants (both have > 5 stock)
      expect(screen.getByText('TEST001-RED-M')).toBeInTheDocument();
      expect(screen.getByText('TEST001-BLUE-L')).toBeInTheDocument();
    });

    it('should allow searching variants', async () => {
      renderWithRouter(<VariantsPage />);

      await waitFor(() => {
        expect(screen.getByText('Product Variants')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        'Search variants, products...'
      );
      fireEvent.change(searchInput, { target: { value: 'RED' } });

      await waitFor(() => {
        expect(screen.getByText('TEST001-RED-M')).toBeInTheDocument();
        expect(screen.queryByText('TEST001-BLUE-L')).not.toBeInTheDocument();
      });
    });

    it('should navigate to product detail when clicking view product', async () => {
      renderWithRouter(<VariantsPage />);

      await waitFor(() => {
        expect(screen.getByText('Product Variants')).toBeInTheDocument();
      });

      const viewProductButton = screen.getByText('View Product');
      fireEvent.click(viewProductButton);

      expect(mockPush).toHaveBeenCalledWith('/products/test-product-1');
    });

    it('should allow sorting variants by different criteria', async () => {
      renderWithRouter(<VariantsPage />);

      await waitFor(() => {
        expect(screen.getByText('Product Variants')).toBeInTheDocument();
      });

      // Initially sorted by SKU
      const sortSelect = screen.getByDisplayValue('Sort by SKU');
      fireEvent.click(sortSelect);
      fireEvent.click(screen.getByText('Sort by Color'));

      // Order should change (Blue before Red alphabetically)
      const variantCards = screen.getAllByText(/TEST001-/);
      expect(variantCards[0]).toHaveTextContent('TEST001-BLUE-L');
      expect(variantCards[1]).toHaveTextContent('TEST001-RED-M');
    });
  });

  describe('Navigation Integration', () => {
    it('should maintain proper navigation flow between pages', async () => {
      // Start from products page
      renderWithRouter(<ProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Navigate to product detail
      const viewButton = screen.getByText('View Product');
      fireEvent.click(viewButton);
      expect(mockPush).toHaveBeenCalledWith('/products/test-product-1');

      // From product detail, should be able to go back to products
      renderWithRouter(<ProductDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Back to Products')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Products');
      fireEvent.click(backButton);
      expect(mockPush).toHaveBeenCalledWith('/products');
    });

    it('should allow navigation to variants page from anywhere', async () => {
      renderWithRouter(<ProductDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('View All Variants')).toBeInTheDocument();
      });

      const allVariantsButton = screen.getByText('View All Variants');
      fireEvent.click(allVariantsButton);
      expect(mockPush).toHaveBeenCalledWith('/variants');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across all pages', async () => {
      // Products page should show correct variant count
      renderWithRouter(<ProductsPage />);
      await waitFor(() => {
        expect(screen.getByText('2 variants')).toBeInTheDocument();
      });

      // Product detail should show same data
      renderWithRouter(<ProductDetailPage />);
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total variants
      });

      // Variants page should show all variants
      renderWithRouter(<VariantsPage />);
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total variants
      });
    });

    it('should update data across pages when variants are modified', async () => {
      // Mock variant creation
      mockStorageService.addProductVariant.mockResolvedValue({
        ...mockVariants[0],
        id: 'variant-3',
        sku: 'TEST001-GREEN-S',
        color: 'Green',
        size: 'S',
      });

      renderWithRouter(<ProductDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('Add Variant')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Variant');
      fireEvent.click(addButton);

      // Fill out form and submit
      const skuInput = screen.getByLabelText('SKU');
      fireEvent.change(skuInput, { target: { value: 'TEST001-GREEN-S' } });

      const createButton = screen.getByText('Create Variant');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockStorageService.addProductVariant).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully when data loading fails', async () => {
      mockStorageService.getProducts.mockRejectedValue(
        new Error('Network error')
      );

      renderWithRouter(<ProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('No products found')).toBeInTheDocument();
      });
    });

    it('should handle variant operations errors', async () => {
      mockStorageService.deleteProductVariant.mockRejectedValue(
        new Error('Delete failed')
      );

      renderWithRouter(<VariantsPage />);

      await waitFor(() => {
        expect(screen.getByText('TEST001-RED-M')).toBeInTheDocument();
      });

      // Try to delete variant
      const deleteButton = screen.getByTitle('Delete variant');
      fireEvent.click(deleteButton);

      // Should show error handling
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error deleting variant:',
          expect.any(Error)
        );
      });
    });
  });
});
