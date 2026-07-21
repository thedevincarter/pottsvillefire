import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin } from "@/lib/auth";
import { createTraining, type TrainingInput } from "@/lib/trainings";
import { errorMessage } from "@/lib/errors";

export async function POST(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data: TrainingInput = await request.json();
  try {
    await createTraining(data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to create training:", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}
