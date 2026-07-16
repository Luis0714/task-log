import { sprintTimesShareImageColors } from "@/lib/sprints/sprint-times-share-image-colors";

type ShareIconSvgProps = {
  size?: number;
  color?: string;
};

export function SprintTimesShareDevIconSvg({
  size = 14,
  color = sprintTimesShareImageColors.development,
}: Readonly<ShareIconSvgProps>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M13 5h8" />
      <path d="M13 12h8" />
      <path d="M13 19h8" />
      <path d="m3 5 2 2-2 2" />
      <path d="m3 12 2 2-2 2" />
      <path d="m3 19 2 2-2 2" />
    </svg>
  );
}

export function SprintTimesShareBugIconSvg({
  size = 14,
  color = sprintTimesShareImageColors.bug,
}: Readonly<ShareIconSvgProps>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M12 22V8" />
      <path d="M5 8h14" />
      <path d="M7 12h10" />
      <path d="M9 16h6" />
    </svg>
  );
}

export function SprintTimesShareClockIconSvg({
  size = 14,
  color = sprintTimesShareImageColors.sprintTotal,
}: Readonly<ShareIconSvgProps>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function SprintTimesShareCalendarOffIconSvg({
  size = 14,
  color = sprintTimesShareImageColors.news,
}: Readonly<ShareIconSvgProps>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6h16" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M4 10v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
      <path d="M16 14h-4" />
      <path d="M16 18h-2" />
      <path d="m3 3 18 18" />
    </svg>
  );
}
