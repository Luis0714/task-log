import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import type { SessionAuthMethod } from "@/lib/auth/session-auth-method";

export type ConnectMethodPreviewProps = {
  method: SessionAuthMethod;
};

export function ConnectMethodPreview({ method }: ConnectMethodPreviewProps) {
  if (method === "oauth") {
    const copy = CONNECT_ADO_COPY.microsoft;
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        <p>{copy.intro}</p>
        <p>{copy.adminNote}</p>
        <p>{copy.sessionNote}</p>
      </div>
    );
  }

  return null;
}
