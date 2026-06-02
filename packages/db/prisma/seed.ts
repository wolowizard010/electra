/**
 * Electra Database Seed Script
 * Creates initial users (admin, operator, customer) and sample product catalog with inventory.
 * Run with: pnpm --filter @electra/db db:seed
 */

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Seeding Electra database...\n');

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminHash = await hashPassword('admin123');
  const operatorHash = await hashPassword('operator123');
  const customerHash = await hashPassword('customer123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@electra.com' },
    update: {},
    create: {
      email: 'admin@electra.com',
      passwordHash: adminHash,
      firstName: 'Arjun',
      lastName: 'Sharma',
      role: Role.ADMIN,
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@electra.com' },
    update: {},
    create: {
      email: 'operator@electra.com',
      passwordHash: operatorHash,
      firstName: 'Priya',
      lastName: 'Mehta',
      role: Role.WAREHOUSE_OPERATOR,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@electra.com' },
    update: {},
    create: {
      email: 'customer@electra.com',
      passwordHash: customerHash,
      firstName: 'Rahul',
      lastName: 'Verma',
      role: Role.CUSTOMER,
    },
  });

  console.log(`✅ Users created:`);
  console.log(`   Admin     → admin@electra.com / admin123`);
  console.log(`   Operator  → operator@electra.com / operator123`);
  console.log(`   Customer  → customer@electra.com / customer123\n`);

  // ─── Products ─────────────────────────────────────────────────────────────
  const products = [
    {
      sku: 'ELEC-TWS-001',
      name: 'Apple AirPods Max — Midnight Black',
      description: 'High-fidelity audio with active noise cancellation and spatial audio. Features a custom acoustic design and the H1 chip for a breakthrough listening experience.',
      price: 59900,
      weightKg: 0.384,
      dimensions: { widthCm: 18.7, heightCm: 16.8, depthCm: 8.3 },
      images: ['https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400'],
      quantity: 50,
      reserved: 0,
      location: 'Aisle A, Shelf 1',
    },
    {
      sku: 'ELEC-PHN-002',
      name: 'Samsung Galaxy S24 Ultra — Titanium Gray',
      description: 'Galaxy AI is here. Features a 200MP camera, Snapdragon 8 Gen 3, titanium exterior, built-in S Pen, and a 6.8" flat QHD+ display with Gorilla Armor.',
      price: 129999,
      weightKg: 0.232,
      dimensions: { widthCm: 7.9, heightCm: 16.2, depthCm: 0.86 },
      images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400'],
      quantity: 25,
      reserved: 2,
      location: 'Aisle A, Shelf 2',
    },
    {
      sku: 'ELEC-LAP-003',
      name: 'MacBook Air 15" M3 — Space Gray',
      description: 'Supercharged by M3. The 15-inch MacBook Air features a liquid retina display, 1080p FaceTime HD camera, 16GB RAM, 512GB SSD, and up to 18 hours of battery life.',
      price: 134900,
      weightKg: 1.51,
      dimensions: { widthCm: 34, heightCm: 23.7, depthCm: 1.15 },
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
      quantity: 15,
      reserved: 1,
      location: 'Aisle B, Shelf 1',
    },
    {
      sku: 'ELEC-TAB-004',
      name: 'iPad Pro 13-inch M4 — Silver',
      description: 'The ultimate iPad experience. Astonishingly thin design featuring the groundbreaking M4 chip, Ultra Retina XDR OLED display, and all-day battery life.',
      price: 129900,
      weightKg: 0.579,
      dimensions: { widthCm: 28.1, heightCm: 21.5, depthCm: 0.51 },
      images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'],
      quantity: 20,
      reserved: 0,
      location: 'Aisle B, Shelf 2',
    },
    {
      sku: 'ELEC-WCH-005',
      name: 'Apple Watch Ultra 2 — Black Titanium',
      description: 'Rugged and capable. Features the S9 SiP, a magical new double tap gesture, our brightest display ever, precision dual-frequency GPS, and up to 36 hours of battery.',
      price: 89900,
      weightKg: 0.061,
      dimensions: { widthCm: 4.9, heightCm: 4.4, depthCm: 1.4 },
      images: ['https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400'],
      quantity: 30,
      reserved: 3,
      location: 'Aisle C, Shelf 1',
    },
    {
      sku: 'ELEC-CAM-006',
      name: 'Sony Alpha A7R V — Body Only',
      description: 'A new level of camera intelligence. Features a 61.0 MP full-frame sensor, AI-based Real-time Recognition AF, 8-stop in-body image stabilization, and 8K video.',
      price: 353990,
      weightKg: 0.723,
      dimensions: { widthCm: 13.1, heightCm: 9.6, depthCm: 8.2 },
      images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400'],
      quantity: 8,
      reserved: 0,
      location: 'Aisle C, Shelf 2',
    },
    {
      sku: 'ELEC-SPK-007',
      name: 'Bose SoundLink Max — Sandstone',
      description: 'Epic stereo sound and deep bass. This rugged, IP67 waterproof and dustproof portable Bluetooth speaker features up to 20 hours of playtime and a built-in handle.',
      price: 39900,
      weightKg: 2.13,
      dimensions: { widthCm: 26.5, heightCm: 12.0, depthCm: 10.5 },
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'],
      quantity: 40,
      reserved: 5,
      location: 'Aisle D, Shelf 1',
    },
    {
      sku: 'ELEC-MON-008',
      name: 'LG 34" Curved OLED UltraWide Monitor',
      description: '34-inch 21:9 WQHD (3440 x 1440) curved OLED display with 240Hz refresh rate, 0.03ms (GtG) response time, DisplayHDR True Black 400, and AMD FreeSync Premium Pro.',
      price: 110000,
      weightKg: 9.3,
      dimensions: { widthCm: 80.4, heightCm: 57.5, depthCm: 28.3 },
      images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400'],
      quantity: 3,
      reserved: 1,
      location: 'Aisle D, Shelf 2',
    },
  ];

  let productCount = 0;
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: p.price,
        weightKg: p.weightKg,
        dimensions: p.dimensions,
        images: p.images,
        isActive: true,
        inventory: {
          create: {
            quantity: p.quantity,
            reserved: p.reserved,
            location: p.location,
          },
        },
      },
    });
    productCount++;
  }

  console.log(`✅ Products seeded: ${productCount} electronics items with inventory\n`);

  // ─── Customer Address ──────────────────────────────────────────────────────
  await prisma.address.upsert({
    where: { id: 'seed-addr-001' },
    update: {},
    create: {
      id: 'seed-addr-001',
      userId: customer.id,
      isDefault: true,
      label: 'Home',
      street1: '12, MG Road',
      street2: 'Near City Mall',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      phone: '+919876543210',
    },
  });

  console.log(`✅ Sample address created for customer\n`);
  console.log('🎉 Database seeding complete!\n');
  console.log('Login credentials:');
  console.log('  Admin:    admin@electra.com     / admin123');
  console.log('  Operator: operator@electra.com  / operator123');
  console.log('  Customer: customer@electra.com  / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
