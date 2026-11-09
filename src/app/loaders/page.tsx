"use client";

import { Gallery } from "@/components/Gallery";
import { LOADERS } from "@/lib/loaders";

export default function LoadersPage() {
  return (
    <Gallery
      title="Loaders"
      items={LOADERS}
      links={[
        { href: "/scenes", label: "Scenes" },
        { href: "/", label: "Steps" },
        { href: "/pixel", label: "Night runner" },
      ]}
    />
  );
}
