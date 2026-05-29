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

  const copy = CONNECT_ADO_COPY.pat;
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      <p>{copy.intro}</p>
      <ol className="list-decimal space-y-1 pl-4">
        {copy.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p>{copy.expiryNote}</p>
    </div>
  );
}
