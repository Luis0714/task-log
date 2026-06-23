"use client";

import Link from "next/link";

export function TimeLogCopilotLink() {
  return (
    <p className="text-muted-foreground text-pretty text-sm">
      ¿Prefieres lenguaje natural?{" "}
      <Link href="/neos-ia" className="text-primary font-medium hover:underline">
        Usa Neos IA
      </Link>
    </p>
  );
}
