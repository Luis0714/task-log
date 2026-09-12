import { describe, expect, it } from "vitest";

import {
  buildAdoPullRequestUrl,
  resolveAdoPullRequestUrl,
} from "@/lib/azure-devops/pull-request-url";

describe("buildAdoPullRequestUrl", () => {
  it("builds the Azure DevOps pull request web url", () => {
    expect(
      buildAdoPullRequestUrl({
        organization: "acme",
        project: "platform",
        repository: "task-log",
        pullRequestId: 128,
      }),
    ).toBe("https://dev.azure.com/acme/platform/_git/task-log/pullrequest/128");
  });

  it("returns empty when a segment is missing or placeholder", () => {
    expect(
      buildAdoPullRequestUrl({
        organization: "acme",
        project: "platform",
        repository: "—",
        pullRequestId: 128,
      }),
    ).toBe("");
    expect(
      buildAdoPullRequestUrl({
        organization: "",
        project: "platform",
        repository: "task-log",
        pullRequestId: 128,
      }),
    ).toBe("");
    expect(
      buildAdoPullRequestUrl({
        organization: "acme",
        project: "platform",
        repository: "task-log",
        pullRequestId: 0,
      }),
    ).toBe("");
  });
});

describe("resolveAdoPullRequestUrl", () => {
  it("returns null when organization is missing", () => {
    expect(resolveAdoPullRequestUrl(null, "platform", "task-log", 12)).toBeNull();
  });

  it("returns the built url when every part is present", () => {
    expect(resolveAdoPullRequestUrl("acme", "platform", "task-log", 12)).toBe(
      "https://dev.azure.com/acme/platform/_git/task-log/pullrequest/12",
    );
  });
});
