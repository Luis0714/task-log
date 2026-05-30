"use client";

import { useCallback, useState } from "react";

import { EMPTY_CONNECT_PAT_VALUES } from "@/lib/auth/connect-pat.types";
import { parseAdoUrl } from "@/lib/auth/parse-ado-url";
import { registerLocalPat } from "@/services/auth/register-local.service";

export type RegisterCredentials = {
  username: string;
  password: string;
  notice: string;
};

export function useRegisterPatForm() {
  const [pat, setPat] = useState(EMPTY_CONNECT_PAT_VALUES.pat);
  const [organization, setOrganization] = useState(
    EMPTY_CONNECT_PAT_VALUES.organization,
  );
  const [project, setProject] = useState(EMPTY_CONNECT_PAT_VALUES.project);
  const [team, setTeam] = useState(EMPTY_CONNECT_PAT_VALUES.team);
  const [adoUrl, setAdoUrl] = useState(EMPTY_CONNECT_PAT_VALUES.adoUrl);
  const [urlParseError, setUrlParseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<RegisterCredentials | null>(
    null,
  );

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
    const result = await registerLocalPat({
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

    setCredentials({
      username: result.username,
      password: result.password,
      notice: result.notice,
    });
  }, [clearErrors, organization, pat, project, team]);

  return {
    pat,
    organization,
    project,
    team,
    adoUrl,
    urlParseError,
    submitting,
    errorMessage,
    credentials,
    setPat: setPatValue,
    setOrganization: setOrganizationValue,
    setProject: setProjectValue,
    setTeam: setTeamValue,
    setAdoUrl: setAdoUrlValue,
    submit,
  };
}
