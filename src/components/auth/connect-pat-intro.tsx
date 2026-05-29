import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";

export function ConnectPatIntro() {
  const copy = CONNECT_ADO_COPY.pat;

  return (
    <div className="space-y-3">
      <h3 className="font-medium">{copy.panelTitle}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{copy.intro}</p>
      <ol className="text-muted-foreground list-decimal space-y-1.5 pl-4 text-sm leading-relaxed">
        {copy.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="text-muted-foreground text-sm leading-relaxed">{copy.expiryNote}</p>
    </div>
  );
}
