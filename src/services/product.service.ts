import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product, ProductCategory } from '../entity/product.entity';

export interface ProductQueryOptions {
  category?: ProductCategory;
  isActive?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Get all products with optional filtering
   */
  async findAll(options?: ProductQueryOptions): Promise<Product[]> {
    const query = this.productRepository.createQueryBuilder('product');

    // Apply filters
    if (options?.category) {
      query.andWhere('product.category = :category', {
        category: options.category,
      });
    }

    if (options?.isActive !== undefined) {
      query.andWhere('product.isActive = :isActive', {
        isActive: options.isActive,
      });
    }

    if (options?.search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.description ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    if (options?.minPrice !== undefined) {
      query.andWhere('product.standardPrice >= :minPrice', {
        minPrice: options.minPrice,
      });
    }

    if (options?.maxPrice !== undefined) {
      query.andWhere('product.standardPrice <= :maxPrice', {
        maxPrice: options.maxPrice,
      });
    }

    query.orderBy('product.name', 'ASC');

    return await query.getMany();
  }

  /**
   * Find a single product by ID
   */
  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  /**
   * Find a product by SKU
   */
  async findBySku(sku: string): Promise<Product | null> {
    return await this.productRepository.findOne({ where: { sku } });
  }

  /**
   * Find products by category
   */
  async findByCategory(category: ProductCategory): Promise<Product[]> {
    return await this.productRepository.find({
      where: { category, isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Get all fuel products
   */
  async getFuels(): Promise<Product[]> {
    return await this.findByCategory(ProductCategory.FUEL);
  }

  /**
   * Get all lubricant products
   */
  async getLubricants(): Promise<Product[]> {
    return await this.findByCategory(ProductCategory.LUBRICANT);
  }

  /**
   * Get all accessory products
   */
  async getAccessories(): Promise<Product[]> {
    return await this.findByCategory(ProductCategory.ACCESSORY);
  }

  /**
   * Get all convenience items
   */
  async getConvenience(): Promise<Product[]> {
    return await this.findByCategory(ProductCategory.CONVENIENCE);
  }

  /**
   * Search products by name, SKU, or description
   */
  async search(searchTerm: string): Promise<Product[]> {
    return await this.productRepository
      .createQueryBuilder('product')
      .where(
        'product.name ILIKE :search OR product.sku ILIKE :search OR product.description ILIKE :search',
        { search: `%${searchTerm}%` },
      )
      .andWhere('product.isActive = :isActive', { isActive: true })
      .orderBy('product.name', 'ASC')
      .getMany();
  }

  /**
   * Get products within a price range
   */
  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
  ): Promise<Product[]> {
    return await this.productRepository
      .createQueryBuilder('product')
      .where('product.standardPrice >= :minPrice', { minPrice })
      .andWhere('product.standardPrice <= :maxPrice', { maxPrice })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .orderBy('product.standardPrice', 'ASC')
      .getMany();
  }

  /**
   * Get active products only
   */
  async findActive(): Promise<Product[]> {
    return await this.productRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Get inactive products
   */
  async findInactive(): Promise<Product[]> {
    return await this.productRepository.find({
      where: { isActive: false },
      order: { name: 'ASC' },
    });
  }

  /**
   * Get product count by category
   */
  async getCountByCategory(): Promise<{ category: string; count: number }[]> {
    return await this.productRepository
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('product.category')
      .getRawMany();
  }

  /**
   * Get total product count
   */
  async count(): Promise<number> {
    return await this.productRepository.count();
  }

  /**
   * Get active product count
   */
  async countActive(): Promise<number> {
    return await this.productRepository.count({ where: { isActive: true } });
  }

  /**
   * Create a new product
   */
  async create(productData: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(productData);
    return await this.productRepository.save(product);
  }

  /**
   * Update an existing product
   */
  async update(id: number, productData: Partial<Product>): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, productData);
    return await this.productRepository.save(product);
  }

  /**
   * Soft delete a product (mark as inactive)
   */
  async deactivate(id: number): Promise<Product> {
    return await this.update(id, { isActive: false });
  }

  /**
   * Reactivate a product
   */
  async activate(id: number): Promise<Product> {
    return await this.update(id, { isActive: true });
  }

  /**
   * Hard delete a product
   */
  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  /**
   * Check if SKU exists
   */
  async skuExists(sku: string, excludeId?: number): Promise<boolean> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .where('product.sku = :sku', { sku });

    if (excludeId) {
      query.andWhere('product.id != :id', { id: excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  /**
   * Get products that need reordering (low stock alert)
   * This will be useful when combined with inventory
   */
  async getLowStockProducts(): Promise<any[]> {
    // This will query products with low inventory
    // We'll implement this fully when we create the inventory service
    return [];
  }
}
