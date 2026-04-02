import { redirect } from "next/navigation";

export default async function DetailPage({
  params,
}: {
  params: Promise<{ manifestSlug: string }>;
}) {
  const { manifestSlug } = await params;
  redirect(`/onboarding/${manifestSlug}`);
}
