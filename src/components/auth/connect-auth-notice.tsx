export type ConnectAuthNoticeProps = {
  message: string;
};

export function ConnectAuthNotice({ message }: ConnectAuthNoticeProps) {
  return (
    <p
      className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
      role="alert"
    >
      {message}
    </p>
  );
}
