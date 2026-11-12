import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { learningPathCreateSchema } from "@/lib/validations/api";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const clientIp = getClientIp(request);
  const [userLimit, ipLimit] = await Promise.all([
    checkRateLimit(`lp:user:${user.id}`, 10, 60),
    checkRateLimit(`lp:ip:${clientIp}`, 15, 60),
  ]);

  if (!userLimit.success || !ipLimit.success) {
    return NextResponse.json({ error: "Too many learning paths created recently. Please wait." }, { status: 429 });
  }

  const rawBody = await request.json().catch(() => null);
  const validation = learningPathCreateSchema.safeParse(rawBody);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0]?.message || "Invalid input." }, { status: 400 });
  }

  const { title, description } = validation.data;

  const { data: path, error } = await supabase
    .from("user_learning_paths")
    .insert({ user_id: user.id, title, description })
    .select("id, title, description, created_at")
    .single();
  if (error) return NextResponse.json({ error: `Could not create learning path: ${error.message}` }, { status: 500 });

  return NextResponse.json({ path }, { status: 201 });
}
