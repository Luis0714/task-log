"use client";

import { Suspense } from "react";

import { ConnectAuthNotice } from "@/components/auth/connect-auth-notice";
import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectSignInPanel } from "@/components/auth/connect-sign-in-panel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuthNoticeFromUrl } from "@/hooks/auth/use-auth-notice-from-url";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
export type ConnectAdoSheetProps = {
  connectOptions: ConnectAuthOptions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ConnectAuthNoticeSlot() {
  const authNotice = useAuthNoticeFromUrl();
  if (!authNotice) return null;
  return <ConnectAuthNotice message={authNotice} />;
}

export function ConnectAdoSheet({
  connectOptions,
  open,
  onOpenChange,
}: ConnectAdoSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{CONNECT_ADO_COPY.sheetTitle}</SheetTitle>
          <SheetDescription>{CONNECT_ADO_COPY.sheetSubtitle}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          <Suspense fallback={null}>
            <ConnectAuthNoticeSlot />
          </Suspense>

          <ConnectSignInPanel
            connectOptions={connectOptions}
            onConnected={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
