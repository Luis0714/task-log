import { AppSidebar } from "@/components/layout/app-sidebar";
import { mapAuthStateToConnectionDisplay } from "@/lib/auth/connection-display";
import { getServerAuthState } from "@/lib/auth/server-state";

export const dynamic = "force-dynamic";

export default async function Home() {
  const auth = await getServerAuthState();
  const connection = mapAuthStateToConnectionDisplay(auth);

  return (
    <div className="bg-background flex min-h-full flex-col md:flex-row">
      <AppSidebar connection={connection} activePath="/" className="md:w-64 md:shrink-0" />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col p-4 sm:max-w-lg md:max-w-none md:p-6">
        <p className="text-muted-foreground text-sm">Contenido de la vista — Dashboard (próximamente)</p>
      </main>
    </div>
  );
}
