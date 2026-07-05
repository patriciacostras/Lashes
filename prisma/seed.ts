import { PrismaClient } from "@prisma/client";
import { defaultServices } from "../lib/services";

const prisma = new PrismaClient();

async function main() {
  for (const service of defaultServices) {
    const { id: _id, ...serviceData } = service;

    await prisma.service.upsert({
      where: { name: service.name },
      update: serviceData,
      create: service
    });
  }

  await prisma.service.updateMany({
    where: {
      name: { notIn: defaultServices.map((service) => service.name) }
    },
    data: { isActive: false }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
