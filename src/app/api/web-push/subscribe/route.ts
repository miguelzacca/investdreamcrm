import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const { endpoint, keys: { p256dh, auth } } = subscription;

    // Check if subscription already exists for this endpoint
    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint },
    });

    if (existing) {
      // If it exists, update it (keys might have rotated, or user changed)
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { userId: session.user.id, p256dh, auth },
      });
      return NextResponse.json({ success: true, message: "Subscription updated" });
    }

    await prisma.pushSubscription.create({
      data: {
        userId: session.user.id,
        endpoint,
        p256dh,
        auth,
      },
    });

    return NextResponse.json({ success: true, message: "Subscription saved" }, { status: 201 });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Optionally, add a DELETE method to unsubscribe
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint,
      },
    });

    return NextResponse.json({ success: true, message: "Subscription deleted" });
  } catch (error) {
    console.error("Error deleting push subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
