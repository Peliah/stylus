import { prisma } from '../lib/prisma';

const VENDOR_PHONE = process.env.VENDOR_PHONE_NUMBER || 'your_vendor_phone_number@c.us';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create default Vendor
  const vendor = await prisma.vendor.upsert({
    where: { phoneNumber: VENDOR_PHONE },
    update: {},
    create: {
      name: 'Stylus Bakery & Store',
      phoneNumber: VENDOR_PHONE,
    },
  });
  console.log(`✅ Default Vendor created: ${vendor.name} (${vendor.phoneNumber})`);

  // 2. Create sample Products linked to the Vendor
  const sampleProducts = [
    {
      name: 'Dark Chocolate Cookie',
      sku: 'COOKIE-DARK-01',
      price: 3.50,
      stock: 50,
      description: 'Rich dark chocolate chip cookie baked fresh daily.',
    },
    {
      name: 'Red Velvet Cupcake',
      sku: 'CUPCAKE-RED-02',
      price: 4.00,
      stock: 20,
      description: 'Classic red velvet cupcake topped with smooth cream cheese frosting.',
    },
    {
      name: 'Sourdough Bread Loaf',
      sku: 'BREAD-SOUR-03',
      price: 6.50,
      stock: 15,
      description: 'Traditional slow-fermented artisanal sourdough loaf.',
    },
    {
      name: 'Espresso Blend Coffee Beans',
      sku: 'COFFEE-ESP-04',
      price: 18.00,
      stock: 30,
      description: '1kg bag of medium-dark roast arabica espresso blend.',
    },
  ];

  console.log('📦 Seeding product catalog...');
  for (const product of sampleProducts) {
    const createdProduct = await prisma.product.upsert({
      where: {
        vendorId_name: {
          vendorId: vendor.id,
          name: product.name,
        },
      },
      update: {
        price: product.price,
        stock: product.stock,
        description: product.description,
        sku: product.sku,
      },
      create: {
        vendorId: vendor.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        stock: product.stock,
        description: product.description,
      },
    });
    console.log(` - Product added: "${createdProduct.name}" (SKU: ${createdProduct.sku || 'N/A'}, Price: $${createdProduct.price}, Stock: ${createdProduct.stock})`);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
