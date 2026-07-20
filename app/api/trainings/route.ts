import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin } from "@/lib/auth";
import { createTraining, type TrainingInput } from "@/lib/trainings";

export async function POST(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data: TrainingInput = await request.json();
  await createTraining(data);
  return NextResponse.json({ ok: true });
}
