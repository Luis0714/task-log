import { createHash, randomBytes } from "crypto";

/** Recurso Azure DevOps (Microsoft Learn). */
export const AZDO_RESOURCE_APP_ID = "499b84ac-1321-427f-aa17-267ca6975798";

export function isEntraOAuthConfigured(): boolean {
  return Boolean(
    process.env.AZURE_AD_CLIENT_ID?.trim() &&
      process.env.AZURE_AD_CLIENT_SECRET?.trim() &&
      process.env.AUTH_BASE_URL?.trim(),
  );
}

export function getAuthBaseUrl(): string {
  const raw = process.env.AUTH_BASE_URL?.trim();
  if (!raw) throw new Error("AUTH_BASE_URL no está definido.");
  return raw.replace(/\/$/, "");
}

function tenantSegment(): string {
  return process.env.AZURE_AD_TENANT_ID?.trim() || "common";
}

export function buildAuthorizeUrl(params: { state: string; codeChallenge: string }): string {
  const clientId = process.env.AZURE_AD_CLIENT_ID!.trim();
  const redirectUri = `${getAuthBaseUrl()}/api/auth/azdo/callback`;
  const scope = [
    `${AZDO_RESOURCE_APP_ID}/.default`,
    "offline_access",
    "openid",
    "profile",
  ].join(" ");

  const u = new URL(
    `https://login.microsoftonline.com/${tenantSegment()}/oauth2/v2.0/authorize`,
  );
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_mode", "query");
  u.searchParams.set("scope", scope);
  u.searchParams.set("state", params.state);
  u.searchParams.set("code_challenge", params.codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("prompt", "consent");
  return u.toString();
}

export function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier, "utf8").digest("base64url");
  return { verifier, challenge };
}

export function generateOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  error?: string;
  error_description?: string;
};

async function postToken(body: Record<string, string>): Promise<TokenResponse> {
  const tenant = tenantSegment();
  const res = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body),
      cache: "no-store",
    },
  );
  const data = (await res.json()) as TokenResponse;
  if (!res.ok) {
    const msg = [data.error, data.error_description].filter(Boolean).join(": ");
    throw new Error(msg || `Token HTTP ${res.status}`);
  }
  return data;
}

export async function exchangeCodeForTokens(params: {
  code: string;
  codeVerifier: string;
}): Promise<TokenResponse> {
  const clientId = process.env.AZURE_AD_CLIENT_ID!.trim();
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET!.trim();
  const redirectUri = `${getAuthBaseUrl()}/api/auth/azdo/callback`;

  return postToken({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: redirectUri,
    code_verifier: params.codeVerifier,
  });
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const clientId = process.env.AZURE_AD_CLIENT_ID!.trim();
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET!.trim();

  return postToken({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: [`${AZDO_RESOURCE_APP_ID}/.default`, "offline_access"].join(" "),
  });
}

export async function fetchAdoProfile(accessToken: string): Promise<{
  displayName: string;
  publicAlias?: string;
  id: string;
}> {
  const res = await fetch(
    "https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.1",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Perfil ADO: ${res.status} ${t.slice(0, 200)}`);
  }
  const j = (await res.json()) as {
    displayName?: string;
    publicAlias?: string;
    coreAttributes?: { PublicAlias?: { value?: string } };
    id?: string;
  };
  const id = j.id;
  if (!id) throw new Error("Perfil ADO sin id.");
  return {
    displayName: j.displayName ?? j.publicAlias ?? "Usuario",
    publicAlias: j.publicAlias ?? j.coreAttributes?.PublicAlias?.value,
    id,
  };
}

type AccountSummary = { accountId: string; accountName: string };

export async function listAdoAccounts(
  accessToken: string,
  memberId: string,
): Promise<AccountSummary[]> {
  const url = new URL("https://app.vssps.visualstudio.com/_apis/accounts");
  url.searchParams.set("api-version", "7.1");
  url.searchParams.set("memberId", memberId);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Cuentas ADO: ${res.status} ${t.slice(0, 200)}`);
  }
  const j = (await res.json()) as {
    value?: Array<{ accountId?: string; accountName?: string }>;
  };
  const value = j.value ?? [];
  return value
    .filter((a) => a.accountId && a.accountName)
    .map((a) => ({ accountId: a.accountId!, accountName: a.accountName! }));
}

export async function pickDefaultProject(
  accessToken: string,
  organization: string,
): Promise<string | undefined> {
  const res = await fetch(
    `https://dev.azure.com/${encodeURIComponent(organization)}/_apis/projects?api-version=7.1&$top=50`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return undefined;
  const j = (await res.json()) as {
    value?: Array<{ name?: string; state?: string }>;
  };
  const first = (j.value ?? []).find((p) => p.state === "wellFormed" || !p.state);
  return first?.name;
}
