import { DataSource } from 'typeorm';
import {
  Product,
  ProductCategory,
  ProductUnit,
} from '../../entity/product.entity';

export async function seedProducts(dataSource: DataSource) {
  const productRepository = dataSource.getRepository(Product);

  // Check if products already exist
  const existingProducts = await productRepository.count();
  if (existingProducts > 0) {
    console.log('Products already seeded, skipping...');
    return;
  }

  const products = [
    // ==================== FUELS ====================
    {
      sku: 'FUEL-RON95',
      name: 'RON-95 (Unleaded)',
      category: ProductCategory.FUEL,
      unit: ProductUnit.LITER,
      standardPrice: 2.05,
      description: 'Regular unleaded petrol with 95 octane rating',
      isActive: true,
    },
    {
      sku: 'FUEL-RON97',
      name: 'RON-97 (Premium)',
      category: ProductCategory.FUEL,
      unit: ProductUnit.LITER,
      standardPrice: 2.45,
      description: 'Premium unleaded petrol with 97 octane rating',
      isActive: true,
    },
    {
      sku: 'FUEL-DIESEL',
      name: 'Diesel',
      category: ProductCategory.FUEL,
      unit: ProductUnit.LITER,
      standardPrice: 2.15,
      description: 'Standard diesel fuel',
      isActive: true,
    },
    {
      sku: 'FUEL-EURO5-DIESEL',
      name: 'Euro 5 Diesel',
      category: ProductCategory.FUEL,
      unit: ProductUnit.LITER,
      standardPrice: 2.33,
      description: 'Euro 5 standard diesel with lower emissions',
      isActive: true,
    },

    // ==================== ENGINE OILS ====================
    {
      sku: 'LUB-ENG-5W30-1L',
      name: 'Engine Oil 5W-30 (1L)',
      category: ProductCategory.LUBRICANT,
      unit: ProductUnit.LITER,
      standardPrice: 25.9,
      description:
        'Fully synthetic engine oil 5W-30, suitable for modern engines',
      isActive: true,
    },
    {
      sku: 'LUB-ENG-10W40-1L',
      name: 'Engine Oil 10W-40 (1L)',
      category: ProductCategory.LUBRICANT,
      unit: ProductUnit.LITER,
      standardPrice: 22.9,
      description: 'Semi-synthetic engine oil 10W-40',
      isActive: true,
    },
    {
      sku: 'LUB-ENG-15W40-1L',
      name: 'Engine Oil 15W-40 (1L)',
      category: ProductCategory.LUBRICANT,
      unit: ProductUnit.LITER,
      standardPrice: 18.9,
      description: 'Mineral engine oil 15W-40, for older engines',
      isActive: true,
    },
    {
      sku: 'LUB-ENG-5W30-4L',
      name: 'Engine Oil 5W-30 (4L)',
      category: ProductCategory.LUBRICANT,
      unit: ProductUnit.PIECE,
      standardPrice: 95.0,
      description: 'Fully synthetic engine oil 5W-30 in 4L container',
      isActive: true,
    },

    // ==================== MOTORCYCLE OILS ====================
    {
      sku: 'LUB-MOTO-10W40-1L',
      name: 'Motorcycle Oil 10W-40 (1L)',
      category: ProductCategory.LUBRICANT,
      unit: ProductUnit.LITER,
      standardPrice: 28.9,
      description: 'Fully synthetic motorcycle engine oil',
      isActive: true,
    },
    {
      sku: 'LUB-MOTO-20W50-1L',
      name: 'Motorcycle Oil 20W-50 (1L)',
      category: ProductCategory.LUBRICANT,
      unit: ProductUnit.LITER,
      standardPrice: 24.9,
      description: 'Semi-synthetic motorcycle engine oil',
      isActive: true,
    },

    // ==================== TRANSMISSION & BRAKE FLUIDS ====================
    {
      sku: 'LUB-ATF-1L',
      name: 'Automatic Transmission Fluid (1L)',
      category: ProductCategory.LUBRICANT,
      unit: ProductUnit.LITER,
      standardPrice: 32.9,
      description: 'ATF for automatic transmissions',
      isActive: true,
    },
    {
      sku: 'LUB-BRAKE-500ML',
      name: 'Brake Fluid DOT 4 (500ml)',
      category: ProductCategory.LUBRICANT,
      unit: ProductUnit.PIECE,
      standardPrice: 12.9,
      description: 'DOT 4 brake fluid for hydraulic brake systems',
      isActive: true,
    },
    {
      sku: 'LUB-COOLANT-1L',
      name: 'Engine Coolant (1L)',
      category: ProductCategory.LUBRICANT,
      unit: ProductUnit.LITER,
      standardPrice: 15.9,
      description: 'Pre-mixed engine coolant/antifreeze',
      isActive: true,
    },

    // ==================== ACCESSORIES ====================
    {
      sku: 'ACC-AIR-FILTER',
      name: 'Air Filter (Universal)',
      category: ProductCategory.ACCESSORY,
      unit: ProductUnit.PIECE,
      standardPrice: 35.0,
      description: 'Universal air filter for various car models',
      isActive: true,
    },
    {
      sku: 'ACC-OIL-FILTER',
      name: 'Oil Filter (Universal)',
      category: ProductCategory.ACCESSORY,
      unit: ProductUnit.PIECE,
      standardPrice: 18.0,
      description: 'Universal oil filter',
      isActive: true,
    },
    {
      sku: 'ACC-WIPER-BLADE',
      name: 'Wiper Blade (Pair)',
      category: ProductCategory.ACCESSORY,
      unit: ProductUnit.PIECE,
      standardPrice: 45.0,
      description: 'Universal wiper blade set',
      isActive: true,
    },
    {
      sku: 'ACC-BATTERY-12V',
      name: 'Car Battery 12V',
      category: ProductCategory.ACCESSORY,
      unit: ProductUnit.PIECE,
      standardPrice: 250.0,
      description: '12V car battery with warranty',
      isActive: true,
    },
    {
      sku: 'ACC-SPARK-PLUG',
      name: 'Spark Plug',
      category: ProductCategory.ACCESSORY,
      unit: ProductUnit.PIECE,
      standardPrice: 12.0,
      description: 'Standard spark plug',
      isActive: true,
    },

    // ==================== CONVENIENCE ITEMS ====================
    {
      sku: 'CONV-WATER-500ML',
      name: 'Bottled Water (500ml)',
      category: ProductCategory.CONVENIENCE,
      unit: ProductUnit.PIECE,
      standardPrice: 1.5,
      description: 'Mineral water 500ml',
      isActive: true,
    },
    {
      sku: 'CONV-COFFEE',
      name: 'Coffee',
      category: ProductCategory.CONVENIENCE,
      unit: ProductUnit.PIECE,
      standardPrice: 3.5,
      description: 'Hot coffee',
      isActive: true,
    },
    {
      sku: 'CONV-ENERGY-DRINK',
      name: 'Energy Drink',
      category: ProductCategory.CONVENIENCE,
      unit: ProductUnit.PIECE,
      standardPrice: 4.5,
      description: 'Energy drink can',
      isActive: true,
    },
    {
      sku: 'CONV-SNACKS',
      name: 'Snacks (Assorted)',
      category: ProductCategory.CONVENIENCE,
      unit: ProductUnit.PIECE,
      standardPrice: 2.5,
      description: 'Various snack items',
      isActive: true,
    },
    {
      sku: 'CONV-CAR-FRESHENER',
      name: 'Car Air Freshener',
      category: ProductCategory.CONVENIENCE,
      unit: ProductUnit.PIECE,
      standardPrice: 5.0,
      description: 'Hanging car air freshener',
      isActive: true,
    },
    {
      sku: 'CONV-TISSUES',
      name: 'Tissue Box',
      category: ProductCategory.CONVENIENCE,
      unit: ProductUnit.PIECE,
      standardPrice: 3.0,
      description: 'Box of tissues',
      isActive: true,
    },
  ];

  // Insert products
  const createdProducts = productRepository.create(products);
  await productRepository.save(createdProducts);

  console.log(`✅ Seeded ${products.length} products successfully!`);

  // Display summary
  const fuelCount = products.filter(
    (p) => p.category === ProductCategory.FUEL,
  ).length;
  const lubricantCount = products.filter(
    (p) => p.category === ProductCategory.LUBRICANT,
  ).length;
  const accessoryCount = products.filter(
    (p) => p.category === ProductCategory.ACCESSORY,
  ).length;
  const convenienceCount = products.filter(
    (p) => p.category === ProductCategory.CONVENIENCE,
  ).length;

  console.log(`   📊 Category breakdown:`);
  console.log(`      - Fuels: ${fuelCount}`);
  console.log(`      - Lubricants: ${lubricantCount}`);
  console.log(`      - Accessories: ${accessoryCount}`);
  console.log(`      - Convenience: ${convenienceCount}`);
}
