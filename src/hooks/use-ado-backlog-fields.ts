"use client";

import { useMemo } from "react";

import { ADO_REQUIRE_PROJECT, useAdoQuery } from "@/hooks/use-ado-query";
import {
  adoBacklogFieldsResponseSchema,
  type AdoBacklogFieldsResponseDto,
} from "@/lib/schemas/ado-backlog-fields";

const INITIAL: AdoBacklogFieldsResponseDto = {
  workItemType: "",
  fields: [],
  responsableCandidates: [],
};

export function useAdoBacklogFields(project: string | undefined, enabled = true) {
  const params = useMemo(() => ({ project }), [project]);
  const { data, loading, error } = useAdoQuery({
    path: "/api/ado/backlog-fields",
    params,
    enabled,
    requireParams: ADO_REQUIRE_PROJECT,
    initialData: INITIAL,
    fallbackError: "No se pudieron cargar los campos de historias.",
    parse: (payload) => {
      const parsed = adoBacklogFieldsResponseSchema.safeParse(payload);
      return parsed.success ? parsed.data : INITIAL;
    },
  });

  return { data, loading, error };
}
