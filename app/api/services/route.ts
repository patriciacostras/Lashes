import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultServices } from "@/lib/services";

export async function GET() {
  try {
    await Promise.all(
      defaultServices.map((service) => {
        const { id: _id, ...serviceData } = service;

        return prisma.service.upsert({
          where: { name: service.name },
          update: serviceData,
          create: service
        });
      })
    );

    await prisma.service.updateMany({
      where: {
        name: { notIn: defaultServices.map((service) => service.name) }
      },
      data: { isActive: false }
    });

    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { priceRon: "asc" }
    });

    return NextResponse.json({ services });
  } catch {
    return NextResponse.json({
      services: defaultServices,
      source: "fallback"
    });
  }
}
