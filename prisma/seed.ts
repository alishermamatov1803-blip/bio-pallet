import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@biopallet.uz" },
    update: {},
    create: {
      fullName: "Administrator",
      email: "admin@biopallet.uz",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const clientsCount = await prisma.client.count();
  if (clientsCount === 0) {
    await prisma.client.createMany({
      data: [
        {
          name: "Aziz Karimov",
          company: "Tashkent Logistics MChJ",
          phone: "+998 90 123 45 67",
          email: "aziz@tashlog.uz",
          address: "Toshkent sh., Chilonzor tumani",
          inn: "301234567",
        },
        {
          name: "Dilnoza Yusupova",
          company: "Fergana Export",
          phone: "+998 91 234 56 78",
          email: "dilnoza@ferexport.uz",
          address: "Farg'ona sh.",
          inn: "302345678",
        },
        {
          name: "Bobur Rashidov",
          company: null,
          phone: "+998 93 345 67 89",
          email: null,
          address: "Samarqand sh.",
          inn: null,
        },
      ],
    });
  }

  const productsCount = await prisma.product.count();
  if (productsCount === 0) {
    await prisma.product.createMany({
      data: [
        {
          name: "Yevropallet 800x1200",
          type: "PALLET",
          sku: "PLT-EU-800",
          unit: "dona",
          price: 85000,
          quantity: 250,
          minQuantity: 50,
          description: "Standart yevropallet, qayta ishlangan yog'ochdan",
        },
        {
          name: "Sanoat palleti 1000x1200",
          type: "PALLET",
          sku: "PLT-IND-1000",
          unit: "dona",
          price: 95000,
          quantity: 120,
          minQuantity: 40,
        },
        {
          name: "Bir martalik pallet",
          type: "PALLET",
          sku: "PLT-DISP-01",
          unit: "dona",
          price: 45000,
          quantity: 30,
          minQuantity: 40,
        },
        {
          name: "Yog'och taxta (xomashyo)",
          type: "MATERIAL",
          sku: "MAT-WOOD-01",
          unit: "m3",
          price: 1200000,
          quantity: 15,
          minQuantity: 5,
        },
        {
          name: "Yetkazib berish xizmati",
          type: "SERVICE",
          sku: "SRV-DELIVERY",
          unit: "xizmat",
          price: 500000,
          quantity: 9999,
          minQuantity: 0,
        },
      ],
    });
  }

  console.log("Seed muvaffaqiyatli yakunlandi.");
  console.log("Login: admin@biopallet.uz / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
