import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type TaskPilotSessionData = {
  pendingOAuth?: { state: string; codeVerifier: string };
  azdoRefreshToken?: string;
  adoProfile?: { displayName: string; publicAlias?: string; id: string };
  defaultOrg?: string;
  defaultProject?: string;
};

function sessionPassword(): string {
  const p = process.env.IRON_SESSION_PASSWORD ?? "";
  if (p.length < 32) {
    throw new Error(
      "IRON_SESSION_PASSWORD debe tener al menos 32 caracteres (iron-session).",
    );
  }
  return p;
}

export function getSessionOptions(): SessionOptions {
  return {
    cookieName: "taskpilot_session",
    password: sessionPassword(),
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
    ttl: 60 * 60 * 24 * 60,
  };
}

export async function getTaskPilotSession() {
  const cookieStore = await cookies();
  return getIronSession<TaskPilotSessionData>(cookieStore, getSessionOptions());
}

export function isIronSessionConfigured(): boolean {
  return (process.env.IRON_SESSION_PASSWORD?.length ?? 0) >= 32;
}
