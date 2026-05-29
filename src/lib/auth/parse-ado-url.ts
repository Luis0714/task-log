export type ParsedAdoUrl = {
  organization: string;
  project: string;
  team?: string;
};

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseTeamFromPath(segments: string[]): string | undefined {
  const sprintsIndex = segments.indexOf("_sprints");
  if (
    sprintsIndex >= 0 &&
    segments[sprintsIndex + 1] === "taskboard" &&
    segments[sprintsIndex + 2]
  ) {
    return decodePathSegment(segments[sprintsIndex + 2]!);
  }

  const backlogsIndex = segments.indexOf("_backlogs");
  if (
    backlogsIndex >= 0 &&
    segments[backlogsIndex + 1] === "backlog" &&
    segments[backlogsIndex + 2]
  ) {
    return decodePathSegment(segments[backlogsIndex + 2]!);
  }

  const boardsIndex = segments.indexOf("_boards");
  if (boardsIndex >= 0 && segments[boardsIndex + 1] === "board") {
    if (segments[boardsIndex + 2] === "t" && segments[boardsIndex + 3]) {
      return decodePathSegment(segments[boardsIndex + 3]!);
    }

    if (segments[boardsIndex + 2] && segments[boardsIndex + 2] !== "t") {
      return decodePathSegment(segments[boardsIndex + 2]!);
    }
  }

  return undefined;
}

/** Extrae organización, proyecto y equipo (si aparece) desde una URL de Azure DevOps. */
export function parseAdoUrl(input: string): ParsedAdoUrl | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);

    if (url.hostname === "dev.azure.com") {
      const segments = url.pathname.split("/").filter(Boolean);
      const [organization, project] = segments;
      if (!organization || !project) return null;

      return {
        organization: decodePathSegment(organization),
        project: decodePathSegment(project),
        team: parseTeamFromPath(segments),
      };
    }

    if (url.hostname.endsWith(".visualstudio.com")) {
      const organization = url.hostname.replace(/\.visualstudio\.com$/, "");
      const segments = url.pathname.split("/").filter(Boolean);
      const [project] = segments;
      if (!organization || !project) return null;

      return {
        organization: decodePathSegment(organization),
        project: decodePathSegment(project),
        team: parseTeamFromPath(segments),
      };
    }

    return null;
  } catch {
    return null;
  }
}
