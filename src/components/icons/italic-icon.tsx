import type { SVGProps } from "react";

export function ItalicIcon(props: Omit<SVGProps<SVGSVGElement>, "viewBox">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={13}
      height={14}
      fill="currentColor"
      viewBox="0 0 13 14"
      aria-hidden
      {...props}
    >
      <path d="M0 14V11.5H4L7 2.5H3V0H13V2.5H9.5L6.5 11.5H10V14H0Z" />
    </svg>
  );
}
