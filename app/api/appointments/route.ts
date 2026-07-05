import { NextResponse } from "next/server";
import { z } from "zod";
import { getEndDate, isInsideBusinessHours } from "@/lib/availability";
import { prisma } from "@/lib/prisma";

const bookingSchema = z.object({
  clientName: z.string().min(2).max(80),
  clientPhone: z.string().min(7).max(30),
  clientEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  serviceId: z.string().min(1),
  startsAt: z.string().datetime()
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get("pin");

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { message: "Baza de date nu este configurata inca." },
      { status: 503 }
    );
  }

  if (process.env.ADMIN_PIN && pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ message: "PIN admin invalid." }, { status: 401 });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      include: { service: true },
      orderBy: { startsAt: "asc" },
      take: 80
    });

    return NextResponse.json({ appointments });
  } catch {
    return NextResponse.json(
      {
        appointments: [],
        message:
          "Nu pot incarca programarile acum. Verifica DATABASE_URL si migrarea bazei de date."
      },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        message:
          "Booking-ul online nu este conectat inca la baza de date. Scrie-mi pe Instagram la @lustlashestimisoara."
      },
      { status: 503 }
    );
  }

  const parsed = bookingSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Verifica datele introduse." },
      { status: 400 }
    );
  }

  try {
    const data = parsed.data;
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId }
    });

    if (!service || !service.isActive) {
      return NextResponse.json(
        { message: "Serviciul ales nu este disponibil." },
        { status: 404 }
      );
    }

    const startsAt = new Date(data.startsAt);
    const endsAt = getEndDate(startsAt, service.durationMin);

    if (startsAt < new Date()) {
      return NextResponse.json(
        { message: "Alege o data viitoare." },
        { status: 400 }
      );
    }

    if (!isInsideBusinessHours(startsAt, endsAt)) {
      return NextResponse.json(
        {
          message:
            "Alege un interval dupa 18:00 pana la 04:00, luni-vineri, sau oricand in weekend."
        },
        { status: 400 }
      );
    }

    const [appointmentConflict, blockedConflict] = await Promise.all([
      prisma.appointment.findFirst({
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt }
        }
      }),
      prisma.blockedSlot.findFirst({
        where: {
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt }
        }
      })
    ]);

    if (appointmentConflict || blockedConflict) {
      return NextResponse.json(
        { message: "Intervalul tocmai a fost ocupat. Alege alta ora." },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail || null,
        notes: data.notes || null,
        serviceId: service.id,
        startsAt,
        endsAt
      },
      include: { service: true }
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        message:
          "Booking-ul online nu se poate conecta la baza de date acum. Scrie-mi pe Instagram la @lustlashestimisoara."
      },
      { status: 503 }
    );
  }
}
