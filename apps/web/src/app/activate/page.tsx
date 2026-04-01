import { redirect } from "next/navigation";

import { featuredManifestSlug } from "@/lib/mock-data";

export default function ActivateIndexPage() {
  redirect(`/activate/${featuredManifestSlug}`);
}
