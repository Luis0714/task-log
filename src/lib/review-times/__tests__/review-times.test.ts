import { describe, expect, it } from "vitest";

import { reviewTimeAverages } from "@/lib/review-times/averages";
import { buildReviewTimeRows } from "@/lib/review-times/build-review-time-rows";
import { formatOpenDuration, formatReviewDuration, durationBetween } from "@/lib/review-times/duration";
import { filterReviewTimeRows } from "@/lib/review-times/filter-rows";
import { mapThreadSignals } from "@/lib/review-times/map-review-signals";
import { currentMonthKey, isCreatedInMonth, monthWindow } from "@/lib/review-times/month";
import { resolveReadyAt } from "@/lib/review-times/resolve-ready-at";
import { resolveReviewMilestones } from "@/lib/review-times/resolve-review-milestones";
import type { ReviewTimePullRequest, ReviewTimeRow } from "@/lib/review-times/types";
import { HUMAN_REVIEW_POLICY_TYPE_IDS } from "@/lib/review-times/policy-types";

const REVIEWER = "reviewer-1";
const BUILD = "0609b952-1397-4640-95ec-e00a01b2c241";

function pullRequest(): ReviewTimePullRequest {
  return {
    id: 128,
    title: "Arreglar login",
    repository: "task-log",
    authorId: "author-1",
    authorName: "Sergio",
    createdAt: "2026-10-20T14:10:00.000Z",
    isDraft: false,
    reviewers: [{ id: REVIEWER, displayName: "Ana Gómez", isRequired: true }],
  };
}

function row(overrides: Partial<ReviewTimeRow> = {}): ReviewTimeRow {
  return {
    pullRequestId: 1,
    title: "Uno",
    repository: "task-log",
    authorId: "author-1",
    authorName: "Sergio",
    reviewerId: REVIEWER,
    reviewerName: "Ana",
    createdAt: "2026-10-20T14:00:00.000Z",
    reviewedAt: "2026-10-20T18:00:00.000Z",
    approvedAt: "2026-10-20T20:00:00.000Z",
    readyAt: null,
    readyState: "none",
    isDraft: false,
    status: "approved",
    ...overrides,
  };
}

describe("resolveReviewMilestones", () => {
  it("toma el comentario anterior al voto de aprobación", () => {
    const milestones = resolveReviewMilestones(
      [
        {
          authorId: REVIEWER,
          publishedAt: "2026-10-20T16:00:00.000Z",
          kind: "text",
          vote: null,
        },
        {
          authorId: REVIEWER,
          publishedAt: "2026-10-20T18:00:00.000Z",
          kind: "vote",
          vote: 10,
        },
      ],
      REVIEWER,
    );

    expect(milestones.reviewedAt).toBe("2026-10-20T16:00:00.000Z");
    expect(milestones.approvedAt).toBe("2026-10-20T18:00:00.000Z");
  });

  it("iguala revisión y aprobación cuando solo hay un voto de aprobar", () => {
    const milestones = resolveReviewMilestones(
      [
        {
          authorId: REVIEWER,
          publishedAt: "2026-10-20T18:00:00.000Z",
          kind: "vote",
          vote: 5,
        },
      ],
      REVIEWER,
    );

    expect(milestones.reviewedAt).toBe(milestones.approvedAt);
  });

  it("un rechazo cuenta como revisión y no cierra la aprobación", () => {
    const milestones = resolveReviewMilestones(
      [
        {
          authorId: REVIEWER,
          publishedAt: "2026-10-20T17:00:00.000Z",
          kind: "vote",
          vote: -10,
        },
      ],
      REVIEWER,
    );

    expect(milestones.reviewedAt).toBe("2026-10-20T17:00:00.000Z");
    expect(milestones.approvedAt).toBeNull();
  });
});

describe("mapThreadSignals", () => {
  it("lee el voto desde las propiedades del hilo", () => {
    const signals = mapThreadSignals([
      {
        properties: {
          CodeReviewThreadType: { $value: "VoteUpdate" },
          CodeReviewVoteResult: { $value: "10" },
        },
        comments: [
          {
            commentType: "system",
            publishedDate: "2026-10-20T18:00:00.000Z",
            author: { id: REVIEWER },
            content: "voted 10",
          },
        ],
      },
    ]);

    expect(signals).toEqual([
      {
        authorId: REVIEWER,
        publishedAt: "2026-10-20T18:00:00.000Z",
        kind: "vote",
        vote: 10,
      },
    ]);
  });
});

describe("resolveReadyAt", () => {
  it("queda pendiente si el build todavía no está aprobado", () => {
    const ready = resolveReadyAt([
      {
        typeId: HUMAN_REVIEW_POLICY_TYPE_IDS[0],
        isEnabled: true,
        isBlocking: true,
        status: "approved",
        completedAt: "2026-10-20T18:00:00.000Z",
      },
      {
        typeId: BUILD,
        isEnabled: true,
        isBlocking: true,
        status: "queued",
        completedAt: null,
      },
    ]);

    expect(ready).toEqual({ readyState: "pending", readyAt: null });
  });

  it("usa la última fecha cuando todos los pasos automáticos están en verde", () => {
    const ready = resolveReadyAt([
      {
        typeId: BUILD,
        isEnabled: true,
        isBlocking: true,
        status: "approved",
        completedAt: "2026-10-20T15:00:00.000Z",
      },
      {
        typeId: "40e92b44-2fe1-46cd-b3d7-f6e0d1d1f0c3",
        isEnabled: true,
        isBlocking: true,
        status: "approved",
        completedAt: "2026-10-20T16:30:00.000Z",
      },
    ]);

    expect(ready.readyState).toBe("ready");
    expect(ready.readyAt).toBe("2026-10-20T16:30:00.000Z");
  });

  it("no inventa pasos automáticos si solo hay políticas de voto", () => {
    const ready = resolveReadyAt([
      {
        typeId: HUMAN_REVIEW_POLICY_TYPE_IDS[1],
        isEnabled: true,
        isBlocking: true,
        status: "queued",
        completedAt: null,
      },
    ]);

    expect(ready.readyState).toBe("none");
  });
});

describe("duración y promedios", () => {
  it("formatea minutos, horas y días", () => {
    expect(formatReviewDuration(45 * 60_000)).toBe("45 min");
    expect(formatReviewDuration((6 * 60 + 20) * 60_000)).toBe("6 h 20 min");
    expect(formatReviewDuration((26 * 60) * 60_000)).toBe("1 d 2 h");
    expect(formatOpenDuration(5 * 60 * 60_000)).toBe("Lleva 5 h");
    expect(durationBetween("2026-10-20T18:00:00.000Z", "2026-10-20T14:00:00.000Z")).toBe(0);
  });

  it("ignora filas abiertas y las que no tienen revisor obligatorio", () => {
    const averages = reviewTimeAverages([
      row(),
      row({
        pullRequestId: 2,
        reviewedAt: null,
        approvedAt: null,
        status: "pending_review",
      }),
      row({
        pullRequestId: 3,
        reviewerId: null,
        reviewedAt: "2026-10-20T15:00:00.000Z",
        approvedAt: "2026-10-20T15:00:00.000Z",
      }),
    ]);

    expect(averages.reviewCount).toBe(1);
    expect(averages.approvalCount).toBe(1);
    expect(averages.reviewMs).toBe(4 * 60 * 60_000);
    expect(averages.approvalMs).toBe(6 * 60 * 60_000);
  });
});

describe("filterReviewTimeRows", () => {
  const rows = [
    row({ reviewerId: "a", authorId: "s", status: "approved" }),
    row({ pullRequestId: 2, reviewerId: "b", authorId: "l", status: "reviewed", approvedAt: null }),
    row({ pullRequestId: 3, title: "Login", reviewerId: "c", status: "pending_review", reviewedAt: null, approvedAt: null }),
  ];

  it("acepta varios revisores a la vez", () => {
    const filtered = filterReviewTimeRows(rows, {
      reviewerIds: ["a", "b"],
      authorIds: [],
      statuses: [],
      search: "",
    });

    expect(filtered.map((item) => item.pullRequestId)).toEqual([2, 1]);
  });

  it("combina estado y búsqueda", () => {
    const filtered = filterReviewTimeRows(rows, {
      reviewerIds: [],
      authorIds: [],
      statuses: ["pending_review"],
      search: "login",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.pullRequestId).toBe(3);
  });
});

describe("buildReviewTimeRows", () => {
  it("arma una fila por cada revisor obligatorio", () => {
    const rows = buildReviewTimeRows({
      pullRequest: {
        ...pullRequest(),
        reviewers: [
          { id: REVIEWER, displayName: "Ana Gómez", isRequired: true },
          { id: "reviewer-2", displayName: "Luis", isRequired: true },
          { id: "optional", displayName: "Opcional", isRequired: false },
        ],
      },
      signals: [
        {
          authorId: REVIEWER,
          publishedAt: "2026-10-20T18:00:00.000Z",
          kind: "vote",
          vote: 10,
        },
      ],
      policies: [],
    });

    expect(rows.map((item) => item.reviewerName)).toEqual(["Ana Gómez", "Luis"]);
    expect(rows[0]?.approvedAt).toBe("2026-10-20T18:00:00.000Z");
    expect(rows[1]?.approvedAt).toBeNull();
  });

  it("deja una fila vacía cuando no hay revisor obligatorio", () => {
    const [built] = buildReviewTimeRows({
      pullRequest: { ...pullRequest(), reviewers: [] },
      signals: [],
      policies: [],
    });

    expect(built?.reviewerId).toBeNull();
    expect(built?.reviewerName).toBe("Sin revisor obligatorio");
    expect(built?.reviewedAt).toBeNull();
  });
});

describe("monthWindow", () => {
  it("cubre el mes civil en America/Bogota", () => {
    const window = monthWindow("2026-10", "America/Bogota");
    expect(window?.start).toBe("2026-10-01T05:00:00.000Z");
    expect(window?.maxTime).toBe("2026-11-01T05:00:00.000Z");
    expect(isCreatedInMonth("2026-10-01T05:00:00.000Z", window!)).toBe(true);
    expect(isCreatedInMonth("2026-09-30T04:59:00.000Z", window!)).toBe(false);
    expect(isCreatedInMonth("2026-11-01T05:00:00.000Z", window!)).toBe(false);
  });

  it("resuelve el mes actual en la zona del proyecto", () => {
    expect(currentMonthKey("America/Bogota", new Date("2026-10-20T15:00:00.000Z"))).toBe("2026-10");
  });
});
