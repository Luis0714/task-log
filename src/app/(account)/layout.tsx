export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      {children}
    </div>
  );
}
