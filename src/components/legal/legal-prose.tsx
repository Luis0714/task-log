import { cn } from "@/lib/utils";

export function LegalProse({
  className,
  children,
}: Readonly<{
  className?: string;
  children: React.ReactNode;
}>) {
  return (
    <div
      className={cn(
        "space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline",
        "[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
