"use client";

import { cn } from "@/lib/utils";

const ROLES = [
  { slug: "developer", label: "Developer" },
  { slug: "qa", label: "QA" },
  { slug: "scrum_master", label: "Scrum Master" },
  { slug: "product_owner", label: "Product Owner" },
  { slug: "product_manager", label: "Product Manager" },
  { slug: "designer", label: "Designer" },
] as const;

type RoleSelectorProps = {
  value: string | null;
  onChange: (role: string) => void;
};

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Selecciona tu rol</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ROLES.map((role) => (
          <button
            key={role.slug}
            type="button"
            onClick={() => onChange(role.slug)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              value === role.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {role.label}
          </button>
        ))}
      </div>
    </div>
  );
}
