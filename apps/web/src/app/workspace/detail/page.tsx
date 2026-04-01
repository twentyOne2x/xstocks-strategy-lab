import { redirect } from "next/navigation";

import { featuredManifestSlug } from "@/lib/mock-data";

export default function DetailIndexPage() {
  redirect(`/workspace/detail/${featuredManifestSlug}`);
}
