"use client";

import { Suspense } from "react";

import { ConnectAuthNotice } from "@/components/auth/connect-auth-notice";
import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectMethodPicker } from "@/components/auth/connect-method-picker";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuthNoticeFromUrl } from "@/hooks/auth/use-auth-notice-from-url";
import { useConnectAdoSheet } from "@/hooks/auth/use-connect-ado-sheet";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SavedConnectionTarget } from "@/lib/auth/server-state";

export type ConnectAdoSheetProps = {
  connectOptions: ConnectAuthOptions;
  savedConnectionTarget?: SavedConnectionTarget | null;
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
  savedConnectionTarget = null,
  open,
  onOpenChange,
}: ConnectAdoSheetProps) {
  const sheet = useConnectAdoSheet({ open });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) sheet.resetFlow();
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{CONNECT_ADO_COPY.sheetTitle}</SheetTitle>
          <SheetDescription>{CONNECT_ADO_COPY.sheetSubtitle}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          <Suspense fallback={null}>
            <ConnectAuthNoticeSlot />
          </Suspense>

          <ConnectMethodPicker
            connectOptions={connectOptions}
            savedConnectionTarget={savedConnectionTarget}
            selectedMethod={sheet.selectedMethod}
            onSelectMethod={sheet.selectMethod}
            onConnected={() => handleOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
