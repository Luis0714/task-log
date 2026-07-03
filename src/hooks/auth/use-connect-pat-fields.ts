"use client";

import { useCallback, useState } from "react";

import {
  EMPTY_CONNECT_PAT_VALUES,
  type ConnectPatFormValues,
} from "@/lib/auth/connect-pat.types";
import { parseAdoUrl } from "@/lib/auth/parse-ado-url";

export type UseConnectPatFieldsOptions = {
  initialValues?: Partial<ConnectPatFormValues>;
};

export function useConnectPatFields(options: UseConnectPatFieldsOptions = {}) {
  const initial = options.initialValues ?? {};

  const [pat, setPat] = useState(initial.pat ?? EMPTY_CONNECT_PAT_VALUES.pat);
  const [organization, setOrganization] = useState(
    initial.organization ?? EMPTY_CONNECT_PAT_VALUES.organization,
  );
  const [project, setProject] = useState(
    initial.project ?? EMPTY_CONNECT_PAT_VALUES.project,
  );
  const [team, setTeam] = useState(initial.team ?? EMPTY_CONNECT_PAT_VALUES.team);
  const [adoUrl, setAdoUrl] = useState(initial.adoUrl ?? EMPTY_CONNECT_PAT_VALUES.adoUrl);
  const [urlParseError, setUrlParseError] = useState<string | null>(null);

  const clearPatFieldErrors = useCallback(() => {
    setUrlParseError(null);
  }, []);

  const setPatValue = useCallback(
    (value: string) => {
      setPat(value);
      clearPatFieldErrors();
    },
    [clearPatFieldErrors],
  );

  const setOrganizationValue = useCallback(
    (value: string) => {
      setOrganization(value);
      clearPatFieldErrors();
    },
    [clearPatFieldErrors],
  );

  const setProjectValue = useCallback(
    (value: string) => {
      setProject(value);
      clearPatFieldErrors();
    },
    [clearPatFieldErrors],
  );

  const setTeamValue = useCallback(
    (value: string) => {
      setTeam(value);
      clearPatFieldErrors();
    },
    [clearPatFieldErrors],
  );

  const setAdoUrlValue = useCallback(
    (value: string) => {
      setAdoUrl(value);
      clearPatFieldErrors();

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
    [clearPatFieldErrors],
  );

  const buildPatPayload = useCallback(() => {
    const trimmedTeam = team.trim();
    return {
      pat,
      organization,
      project,
      ...(trimmedTeam ? { team: trimmedTeam } : {}),
    };
  }, [organization, pat, project, team]);

  return {
    pat,
    organization,
    project,
    team,
    adoUrl,
    urlParseError,
    setPat: setPatValue,
    setOrganization: setOrganizationValue,
    setProject: setProjectValue,
    setTeam: setTeamValue,
    setAdoUrl: setAdoUrlValue,
    clearPatFieldErrors,
    buildPatPayload,
  };
}
