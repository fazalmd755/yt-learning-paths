import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const title = body && typeof body === "object" && "title" in body && typeof body.title === "string"
    ? body.title.trim()
    : "";
  const description = body && typeof body === "object" && "description" in body && typeof body.description === "string"
    ? body.description.trim()
    : "";

  if (!title || title.length > 120) {
    return NextResponse.json({ error: "Give your learning path a name (up to 120 characters)." }, { status: 400 });
  }
  if (description.length > 500) {
    return NextResponse.json({ error: "Description must be 500 characters or fewer." }, { status: 400 });
  }

  const { data: path, error } = await supabase
    .from("user_learning_paths")
    .insert({ user_id: user.id, title, description })
    .select("id, title, description, created_at")
    .single();
  if (error) return NextResponse.json({ error: `Could not create learning path: ${error.message}` }, { status: 500 });

  return NextResponse.json({ path }, { status: 201 });
}
