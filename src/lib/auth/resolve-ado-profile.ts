import { readCachedAdoProfile, writeCachedAdoProfile } from "@/lib/auth/ado-profile-session";
import {
  fetchCurrentAdoProfile,
  type AdoUserProfile,
} from "@/lib/azure-devops/profile";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type ResolveAdoProfileOptions = {
  /** Solo en Route Handlers / Server Actions (Next.js no permite escribir cookies en RSC). */
  persist?: boolean;
};

/** Perfil desde sesión; si falta, consulta ADO. Opcionalmente persiste en cookie. */
export async function resolveAdoProfile(
  auth: AdoCallerAuth,
  options: ResolveAdoProfileOptions = {},
): Promise<AdoUserProfile | null> {
  const cached = await readCachedAdoProfile();
  if (cached) return cached;

  const profile = await fetchCurrentAdoProfile(auth);
  if (profile && options.persist) {
    await writeCachedAdoProfile(profile);
  }
  return profile;
}
