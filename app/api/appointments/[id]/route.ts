import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  pin: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { message: "Baza de date nu este configurata inca." },
      { status: 503 }
    );
  }

  const body = statusSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ message: "Status invalid." }, { status: 400 });
  }

  if (process.env.ADMIN_PIN && body.data.pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ message: "PIN admin invalid." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: body.data.status },
      include: { service: true }
    });

    return NextResponse.json({ appointment });
  } catch {
    return NextResponse.json(
      {
        message:
          "Nu pot actualiza programarea acum. Verifica DATABASE_URL si conexiunea la baza de date."
      },
      { status: 503 }
    );
  }
}
