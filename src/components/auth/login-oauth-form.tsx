"use client";

import { useState } from "react";

import { ConnectMethodOauthAction } from "@/components/auth/connect-method-oauth-action";
import { RoleSelector } from "@/components/auth/role-selector";
import { useAbandonPendingOAuth } from "@/hooks/auth/use-abandon-pending-oauth";

export function LoginOAuthForm() {
  useAbandonPendingOAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <RoleSelector value={selectedRole} onChange={setSelectedRole} />
      <ConnectMethodOauthAction selectedRole={selectedRole} />
    </div>
  );
}
