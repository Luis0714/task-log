import "server-only";

import { parseAdoContextSearchParams } from "@/lib/ado/parse-context-search-params";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import {
  getServerAuthBootstrap,
  getServerAuthProfile,
  type ServerAuthBootstrap,
  type ServerAuthProfileFields,
} from "@/lib/auth/server-state";
import { emptyServerProfileFields } from "@/lib/auth/profile-display";

export type PageAuthContext = {
  searchParams: AdoContextSearchParams;
  auth: ServerAuthBootstrap;
  defaultProject: string | null;
};

export async function resolvePageAuth(
  rawSearchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<PageAuthContext> {
  const searchParams = parseAdoContextSearchParams(await rawSearchParams);
  const auth = await getServerAuthBootstrap();
  const defaultProject =
    auth.authMethod === "pat" ? auth.patProject : auth.defaultProject;

  return { searchParams, auth, defaultProject };
}

export type PageAuthWithProfile = PageAuthContext & {
  profile: ServerAuthProfileFields;
};

export async function resolvePageAuthWithProfile(
  rawSearchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<PageAuthWithProfile> {
  const [pageAuth, profile] = await Promise.all([
    resolvePageAuth(rawSearchParams),
    getServerAuthProfile(),
  ]);

  return {
    ...pageAuth,
    profile: pageAuth.auth.adoExecutionReady ? profile : emptyServerProfileFields,
  };
}
