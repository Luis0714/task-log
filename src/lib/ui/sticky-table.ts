import { cn } from "@/lib/utils";

export function stickyLeftCellClasses(args: {
  leftClass: string;
  widthClass: string;
  bgClass: string;
  zClass: "z-10" | "z-20";
  isLastSticky?: boolean;
  extra?: string;
}): string {
  return cn(
    "sticky",
    args.leftClass,
    args.widthClass,
    args.bgClass,
    args.zClass,
    args.isLastSticky &&
      "after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border/60 after:content-['']",
    args.extra,
  );
}
