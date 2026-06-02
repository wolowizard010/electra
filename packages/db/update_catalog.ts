import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    sku: 'ELEC-TWS-001',
    name: 'Apple AirPods Max — Midnight Black',
    description: 'High-fidelity audio with active noise cancellation and spatial audio. Features a custom acoustic design and the H1 chip for a breakthrough listening experience.',
    price: 59900,
    weightKg: 0.384,
    dimensions: { widthCm: 18.7, heightCm: 16.8, depthCm: 8.3 },
  },
  {
    sku: 'ELEC-PHN-002',
    name: 'Samsung Galaxy S24 Ultra — Titanium Gray',
    description: 'Galaxy AI is here. Features a 200MP camera, Snapdragon 8 Gen 3, titanium exterior, built-in S Pen, and a 6.8" flat QHD+ display with Gorilla Armor.',
    price: 129999,
    weightKg: 0.232,
    dimensions: { widthCm: 7.9, heightCm: 16.2, depthCm: 0.86 },
  },
  {
    sku: 'ELEC-LAP-003',
    name: 'MacBook Air 15" M3 — Space Gray',
    description: 'Supercharged by M3. The 15-inch MacBook Air features a liquid retina display, 1080p FaceTime HD camera, 16GB RAM, 512GB SSD, and up to 18 hours of battery life.',
    price: 134900,
    weightKg: 1.51,
    dimensions: { widthCm: 34, heightCm: 23.7, depthCm: 1.15 },
  },
  {
    sku: 'ELEC-TAB-004',
    name: 'iPad Pro 13-inch M4 — Silver',
    description: 'The ultimate iPad experience. Astonishingly thin design featuring the groundbreaking M4 chip, Ultra Retina XDR OLED display, and all-day battery life.',
    price: 129900,
    weightKg: 0.579,
    dimensions: { widthCm: 28.1, heightCm: 21.5, depthCm: 0.51 },
  },
  {
    sku: 'ELEC-WCH-005',
    name: 'Apple Watch Ultra 2 — Black Titanium',
    description: 'Rugged and capable. Features the S9 SiP, a magical new double tap gesture, our brightest display ever, precision dual-frequency GPS, and up to 36 hours of battery.',
    price: 89900,
    weightKg: 0.061,
    dimensions: { widthCm: 4.9, heightCm: 4.4, depthCm: 1.4 },
  },
  {
    sku: 'ELEC-CAM-006',
    name: 'Sony Alpha A7R V — Body Only',
    description: 'A new level of camera intelligence. Features a 61.0 MP full-frame sensor, AI-based Real-time Recognition AF, 8-stop in-body image stabilization, and 8K video.',
    price: 353990,
    weightKg: 0.723,
    dimensions: { widthCm: 13.1, heightCm: 9.6, depthCm: 8.2 },
  },
  {
    sku: 'ELEC-SPK-007',
    name: 'Bose SoundLink Max — Sandstone',
    description: 'Epic stereo sound and deep bass. This rugged, IP67 waterproof and dustproof portable Bluetooth speaker features up to 20 hours of playtime and a built-in handle.',
    price: 39900,
    weightKg: 2.13,
    dimensions: { widthCm: 26.5, heightCm: 12.0, depthCm: 10.5 },
  },
  {
    sku: 'ELEC-MON-008',
    name: 'LG 34" Curved OLED UltraWide Monitor',
    description: '34-inch 21:9 WQHD (3440 x 1440) curved OLED display with 240Hz refresh rate, 0.03ms (GtG) response time, DisplayHDR True Black 400, and AMD FreeSync Premium Pro.',
    price: 110000,
    weightKg: 9.3,
    dimensions: { widthCm: 80.4, heightCm: 57.5, depthCm: 28.3 },
  },
];

async function updateDB() {
  console.log('Updating catalog with real specs...');
  for (const p of products) {
    await prisma.product.update({
      where: { sku: p.sku },
      data: {
        name: p.name,
        description: p.description,
        price: p.price,
        weightKg: p.weightKg,
        dimensions: p.dimensions,
      }
    });
    console.log(`Updated ${p.sku}`);
  }
  console.log('Done!');
}

updateDB()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
