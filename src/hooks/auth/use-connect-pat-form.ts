"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { EMPTY_CONNECT_PAT_VALUES } from "@/lib/auth/connect-pat.types";
import { parseAdoUrl } from "@/lib/auth/parse-ado-url";
import { buildAdoContextQuery } from "@/lib/ado/parse-context-search-params";
import type { SavedConnectionTarget } from "@/lib/auth/server-state";
import { connectWithPat } from "@/services/auth/connect-ado.service";

export type UseConnectPatFormParams = {
  savedConnectionTarget?: SavedConnectionTarget | null;
  onSuccess?: () => void;
};

export function useConnectPatForm({
  savedConnectionTarget = null,
  onSuccess,
}: UseConnectPatFormParams = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pat, setPat] = useState(EMPTY_CONNECT_PAT_VALUES.pat);
  const [organization, setOrganization] = useState(
    savedConnectionTarget?.organization ?? EMPTY_CONNECT_PAT_VALUES.organization,
  );
  const [project, setProject] = useState(
    savedConnectionTarget?.project ?? EMPTY_CONNECT_PAT_VALUES.project,
  );
  const [team, setTeam] = useState(
    savedConnectionTarget?.team ?? EMPTY_CONNECT_PAT_VALUES.team,
  );
  const [adoUrl, setAdoUrl] = useState(EMPTY_CONNECT_PAT_VALUES.adoUrl);
  const [urlParseError, setUrlParseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setErrorMessage(null);
    setUrlParseError(null);
  }, []);

  const setPatValue = useCallback(
    (value: string) => {
      setPat(value);
      clearErrors();
    },
    [clearErrors],
  );

  const setOrganizationValue = useCallback(
    (value: string) => {
      setOrganization(value);
      clearErrors();
    },
    [clearErrors],
  );

  const setProjectValue = useCallback(
    (value: string) => {
      setProject(value);
      clearErrors();
    },
    [clearErrors],
  );

  const setTeamValue = useCallback(
    (value: string) => {
      setTeam(value);
      clearErrors();
    },
    [clearErrors],
  );

  const setAdoUrlValue = useCallback(
    (value: string) => {
      setAdoUrl(value);
      clearErrors();

      const trimmed = value.trim();
      if (!trimmed) return;

      const parsed = parseAdoUrl(trimmed);
      if (!parsed) {
        setUrlParseError(
          "No pudimos leer la organización y el proyecto desde esa URL.",
        );
        return;
      }

      setOrganization(parsed.organization);
      setProject(parsed.project);
      if (parsed.team) {
        setTeam(parsed.team);
      }
    },
    [clearErrors],
  );

  const submit = useCallback(async () => {
    setSubmitting(true);
    clearErrors();

    const trimmedTeam = team.trim();
    const result = await connectWithPat({
      pat,
      organization,
      project,
      ...(trimmedTeam ? { team: trimmedTeam } : {}),
    });

    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.errorMessage);
      return;
    }

    onSuccess?.();
    router.push(
      `${pathname}${buildAdoContextQuery({
        project,
        ...(trimmedTeam ? { team: trimmedTeam } : {}),
      })}`,
    );
    router.refresh();
  }, [clearErrors, onSuccess, organization, pat, pathname, project, router, team]);

  return {
    pat,
    organization,
    project,
    team,
    adoUrl,
    urlParseError,
    submitting,
    errorMessage,
    setPat: setPatValue,
    setOrganization: setOrganizationValue,
    setProject: setProjectValue,
    setTeam: setTeamValue,
    setAdoUrl: setAdoUrlValue,
    submit,
  };
}
