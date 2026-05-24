import type { AdoUserProfile } from "@/lib/azure-devops/profile";
import { getUserInitials } from "@/lib/auth/user-display";

export const ADO_PROFILE_AVATAR_PATH = "/api/ado/profile/avatar";

export type ServerProfileFields = {
  profileDisplayName: string;
  profileInitials: string;
  profileAvatarUrl: string;
};

export function toServerProfileFields(profile: AdoUserProfile): ServerProfileFields {
  return {
    profileDisplayName: profile.displayName,
    profileInitials: getUserInitials(profile.displayName),
    profileAvatarUrl: ADO_PROFILE_AVATAR_PATH,
  };
}

export const emptyServerProfileFields = {
  profileDisplayName: null,
  profileInitials: null,
  profileAvatarUrl: null,
} as const;
