"use client";

import { useEffect, useState } from "react";

import {
  MOCK_RECENT_PUSHED_BRANCH,
  RECENT_PUSH_DISMISS_STORAGE_KEY,
  recentPushDismissId,
} from "@/lib/pull-requests/mock-recent-pushed-branch";

const RECENT_PUSH_OFFSET_MS = 25_000;

export function useRecentPushedBranchMock() {
  const [visible, setVisible] = useState(false);
  const [pushedAt] = useState(() =>
    new Date(Date.now() - RECENT_PUSH_OFFSET_MS).toISOString(),
  );

  useEffect(() => {
    const dismissedId = sessionStorage.getItem(RECENT_PUSH_DISMISS_STORAGE_KEY);
    setVisible(dismissedId !== recentPushDismissId(MOCK_RECENT_PUSHED_BRANCH));
  }, []);

  return {
    suggestion: visible ? MOCK_RECENT_PUSHED_BRANCH : null,
    pushedAt,
    dismiss: () => {
      sessionStorage.setItem(
        RECENT_PUSH_DISMISS_STORAGE_KEY,
        recentPushDismissId(MOCK_RECENT_PUSHED_BRANCH),
      );
      setVisible(false);
    },
  };
}
