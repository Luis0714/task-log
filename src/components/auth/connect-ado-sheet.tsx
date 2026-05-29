"use client";

import { Suspense } from "react";

import { ConnectAuthNotice } from "@/components/auth/connect-auth-notice";
import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectSheetStepContent } from "@/components/auth/connect-sheet-step-content";
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

export type ConnectAdoSheetProps = {
  connectOptions: ConnectAuthOptions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ConnectAdoSheetBody({
  connectOptions,
  open,
  onOpenChange,
}: ConnectAdoSheetProps) {
  const authNotice = useAuthNoticeFromUrl();
  const sheet = useConnectAdoSheet({ connectOptions, open });

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
          {authNotice ? <ConnectAuthNotice message={authNotice} /> : null}

          <ConnectSheetStepContent
            step={sheet.step}
            selectedMethod={sheet.selectedMethod}
            connectOptions={connectOptions}
            onSelectMethod={sheet.selectMethod}
            onBack={sheet.goBack}
            onConnected={() => handleOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ConnectAdoSheet(props: ConnectAdoSheetProps) {
  return (
    <Suspense fallback={null}>
      <ConnectAdoSheetBody {...props} />
    </Suspense>
  );
}
