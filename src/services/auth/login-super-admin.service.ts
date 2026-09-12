import { postAuthJson } from "@/services/auth/post-auth-json";

export type LoginSuperAdminPayload = {
  password: string;
};

export type LoginSuperAdminFailureReason =
  | "invalid_credentials"
  | "connection_missing"
  | "token_expired";

export type LoginSuperAdminClientResult =
  | { ok: true; landing?: string }
  | {
      ok: false;
      errorMessage: string;
      reason?: LoginSuperAdminFailureReason;
    };

export async function loginSuperAdmin(
  payload: LoginSuperAdminPayload,
): Promise<LoginSuperAdminClientResult> {
  const result = await postAuthJson(
    "/api/auth/super-admin",
    payload,
    "No pudimos iniciar sesión. Inténtalo de nuevo.",
  );

  if (result.ok) {
    const landing =
      typeof result.data.landing === "string" ? result.data.landing : undefined;
    return { ok: true, landing };
  }

  return {
    ok: false,
    errorMessage: result.errorMessage,
    reason: result.reason as LoginSuperAdminFailureReason | undefined,
  };
}
