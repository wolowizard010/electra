import { db } from '@electra/db';
import type { Prisma } from '@electra/db';

export interface ProductFilter {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description: string;
  price: number;
  weightKg: number;
  dimensions: { widthCm: number; heightCm: number; depthCm: number };
  images: string[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  weightKg?: number;
  dimensions?: { widthCm: number; heightCm: number; depthCm: number };
  images?: string[];
  isActive?: boolean;
}

/**
 * Retrieves a single product by its unique UUID, including inventory.
 */
export async function getProductById(id: string) {
  return db.product.findUnique({
    where: { id },
    include: { inventory: true },
  });
}

/**
 * Retrieves a single product by its unique SKU code, including inventory.
 */
export async function getProductBySKU(sku: string) {
  return db.product.findUnique({
    where: { sku },
    include: { inventory: true },
  });
}

/**
 * Lists products using filters, pagination, and sorting.
 */
export async function listProducts(filter: ProductFilter, limit: number = 20, offset: number = 0) {
  const whereClause: Prisma.ProductWhereInput = {};

  if (filter.isActive !== undefined) {
    whereClause.isActive = filter.isActive;
  } else {
    whereClause.isActive = true; // default list active only
  }

  if (filter.query) {
    whereClause.OR = [
      { name: { contains: filter.query, mode: 'insensitive' } },
      { description: { contains: filter.query, mode: 'insensitive' } },
      { sku: { contains: filter.query, mode: 'insensitive' } },
    ];
  }

  if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
    whereClause.price = {};
    if (filter.minPrice !== undefined) {
      whereClause.price.gte = filter.minPrice;
    }
    if (filter.maxPrice !== undefined) {
      whereClause.price.lte = filter.maxPrice;
    }
  }

  const [items, total] = await Promise.all([
    db.product.findMany({
      where: whereClause,
      include: { inventory: true },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    }),
    db.product.count({ where: whereClause }),
  ]);

  return { items, total };
}

/**
 * Creates a new product and initializes its inventory item mapping.
 */
export async function createProduct(data: CreateProductInput) {
  return db.product.create({
    data: {
      sku: data.sku,
      name: data.name,
      description: data.description,
      price: data.price,
      weightKg: data.weightKg,
      dimensions: data.dimensions as Prisma.InputJsonValue,
      images: data.images,
      inventory: {
        create: {
          quantity: 0,
          reserved: 0,
          location: 'UNALLOCATED',
        },
      },
    },
    include: { inventory: true },
  });
}

/**
 * Updates product details by its unique UUID.
 */
export async function updateProduct(id: string, data: UpdateProductInput) {
  const updateData: Prisma.ProductUpdateInput = {
    ...data,
  };
  
  if (data.dimensions) {
    updateData.dimensions = data.dimensions as Prisma.InputJsonValue;
  }

  return db.product.update({
    where: { id },
    data: updateData,
    include: { inventory: true },
  });
}
