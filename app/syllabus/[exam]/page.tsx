import { redirect } from "next/navigation";

export default async function SyllabusPage({ params }: { params: Promise<{ exam: string }> }) {
  await params;
  redirect("/syllabus/select");
}
