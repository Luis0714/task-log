import { cookies } from "next/headers";

const SIDEBAR_COOKIE_NAME = "sidebar_state";

export async function getSidebarDefaultOpen(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value;
  if (value === undefined) return true;
  return value !== "false";
}
