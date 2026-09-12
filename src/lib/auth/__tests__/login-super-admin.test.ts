import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getRepositories,
  getTaskPilotSession,
  refreshAccessToken,
  fetchAdoProfile,
  hydrateOAuthSession,
  hydratePatSession,
} = vi.hoisted(() => ({
  getRepositories: vi.fn(),
  getTaskPilotSession: vi.fn(),
  refreshAccessToken: vi.fn(),
  fetchAdoProfile: vi.fn(),
  hydrateOAuthSession: vi.fn(),
  hydratePatSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ getRepositories }));
vi.mock("@/lib/auth/session", () => ({ getTaskPilotSession }));
vi.mock("@/lib/auth/entra", () => ({ refreshAccessToken, fetchAdoProfile }));
vi.mock("@/lib/auth/hydrate-oauth-session", () => ({ hydrateOAuthSession }));
vi.mock("@/lib/auth/hydrate-pat-session", () => ({ hydratePatSession }));

import { loginSuperAdmin } from "@/lib/auth/login-super-admin";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

const ADMIN_ID = "admin-user-id";

function mockSession() {
  const session = { userRole: undefined as string | undefined, save: vi.fn() };
  getTaskPilotSession.mockResolvedValue(session);
  return session;
}

function mockRepos(overrides?: {
  admin?: { userId: string } | null;
  connection?:
    | {
        authMethod: "oauth";
        refreshToken: string;
        organization: string;
        project: string;
        team: string | null;
      }
    | {
        authMethod: "pat";
        pat: string;
        organization: string;
        project: string;
        team: string | null;
      }
    | null;
}) {
  const findActiveSuperAdmin = vi.fn().mockResolvedValue(
    overrides && "admin" in overrides ? overrides.admin : { userId: ADMIN_ID },
  );
  const loadByUserId = vi.fn().mockResolvedValue(
    overrides && "connection" in overrides
      ? overrides.connection
      : {
          authMethod: "oauth",
          refreshToken: "refresh",
          organization: "org",
          project: "proj",
          team: null,
        },
  );
  const updateOAuthRefreshToken = vi.fn();

  getRepositories.mockReturnValue({
    user: { findActiveSuperAdmin },
    adoConnection: { loadByUserId },
    entraUser: { updateOAuthRefreshToken },
  });

  return { findActiveSuperAdmin, loadByUserId, updateOAuthRefreshToken };
}

describe("loginSuperAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("SUPER_ADMIN_PASSWORD", "owner-secret");
  });

  it("rechaza si la contraseña no coincide", async () => {
    mockRepos();
    const result = await loginSuperAdmin({ password: "wrong" });
    expect(result).toEqual({
      ok: false,
      reason: "invalid_credentials",
      message: USER_MESSAGES.invalidCredentials,
    });
    expect(getTaskPilotSession).not.toHaveBeenCalled();
  });

  it("hidrata la sesión OAuth con el token de la BD", async () => {
    const { updateOAuthRefreshToken } = mockRepos();
    const session = mockSession();
    refreshAccessToken.mockResolvedValue({
      access_token: "access",
      refresh_token: "rotated",
    });
    fetchAdoProfile.mockResolvedValue({
      displayName: "Luis",
      id: "ado-1",
    });

    const result = await loginSuperAdmin({ password: "owner-secret" });

    expect(result).toEqual({ ok: true, landing: "/" });
    expect(refreshAccessToken).toHaveBeenCalledWith("refresh");
    expect(updateOAuthRefreshToken).toHaveBeenCalledWith(ADMIN_ID, "rotated");
    expect(hydrateOAuthSession).toHaveBeenCalledWith(session, {
      organization: "org",
      project: "proj",
      team: undefined,
      taskPilotUserId: ADMIN_ID,
      adoProfile: { displayName: "Luis", id: "ado-1" },
      accessToken: "access",
    });
    expect(session.userRole).toBe("super_admin");
    expect(session.save).toHaveBeenCalled();
  });

  it("hidrata PAT cuando esa es la conexión guardada", async () => {
    mockRepos({
      connection: {
        authMethod: "pat",
        pat: "pat-token",
        organization: "org",
        project: "proj",
        team: "team-a",
      },
    });
    const session = mockSession();

    const result = await loginSuperAdmin({ password: "owner-secret" });

    expect(result).toEqual({ ok: true, landing: "/" });
    expect(hydratePatSession).toHaveBeenCalledWith(session, {
      pat: "pat-token",
      organization: "org",
      project: "proj",
      team: "team-a",
      taskPilotUserId: ADMIN_ID,
    });
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(session.userRole).toBe("super_admin");
  });

  it("avisa si el usuario no tiene conexión ADO guardada", async () => {
    mockRepos({ connection: null });
    const result = await loginSuperAdmin({ password: "owner-secret" });
    expect(result).toEqual({
      ok: false,
      reason: "connection_missing",
      message: USER_MESSAGES.superAdminConnectionMissing,
    });
  });

  it("pide renovar Microsoft si el refresh token expiró", async () => {
    mockRepos();
    mockSession();
    refreshAccessToken.mockRejectedValue(new Error("invalid_grant"));

    const result = await loginSuperAdmin({ password: "owner-secret" });

    expect(result).toEqual({
      ok: false,
      reason: "token_expired",
      message: USER_MESSAGES.superAdminTokenExpired,
    });
  });
});
