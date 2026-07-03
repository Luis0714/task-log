export type FormInlineErrorProps = {
  message?: string | null;
};

export function FormInlineError({ message }: FormInlineErrorProps) {
  if (!message) return null;
  return <p className="text-destructive text-xs">{message}</p>;
}
