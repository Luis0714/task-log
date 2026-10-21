import { describe, expect, it } from "vitest";

import { reviewTimeAverages } from "@/lib/review-times/averages";
import { buildReviewTimeRows } from "@/lib/review-times/build-review-time-rows";
import { formatOpenDuration, formatReviewDuration, durationBetween } from "@/lib/review-times/duration";
import { formatReviewDate } from "@/lib/review-times/format-review-date";
import { workingDurationMs } from "@/lib/review-times/working-duration";
import { filterReviewTimeRows } from "@/lib/review-times/filter-rows";
import { mapThreadSignals } from "@/lib/review-times/map-review-signals";
import {
  currentMonthKey,
  isCreatedInMonth,
  monthWindow,
  normalizeMonthKeys,
} from "@/lib/review-times/month";
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
    isCompleted: false,
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
    isCompleted: false,
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
        authorName: "",
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

const ZONE = "America/Bogota";

describe("duración y promedios", () => {
  it("muestra la hora en formato de 12 horas", () => {
    expect(formatReviewDate("2026-10-20T20:41:00.000Z", ZONE)).toBe("20 de oct, 03:41 PM");
    expect(formatReviewDate("2026-10-20T14:05:00.000Z", ZONE)).toBe("20 de oct, 09:05 AM");
  });

  it("formatea minutos, horas y jornadas de 8:00 a 17:00", () => {
    expect(formatReviewDuration(45 * 60_000)).toBe("45 min");
    expect(formatReviewDuration((6 * 60 + 20) * 60_000)).toBe("6 h 20 min");
    expect(formatReviewDuration(11 * 60 * 60_000)).toBe("1 d 2 h");
    expect(formatOpenDuration(5 * 60 * 60_000)).toBe("Lleva 5 h");
    expect(durationBetween("2026-10-20T18:00:00.000Z", "2026-10-20T14:00:00.000Z", ZONE)).toBe(0);
  });

  it("ignora noches y fines de semana", () => {
    const fridayFourPm = "2026-10-16T21:00:00.000Z";
    const mondayNineAm = "2026-10-19T14:00:00.000Z";
    expect(workingDurationMs(fridayFourPm, mondayNineAm, ZONE)).toBe(2 * 60 * 60_000);

    const tuesdayEvening = "2026-10-20T23:00:00.000Z";
    const wednesdayMorning = "2026-10-21T13:30:00.000Z";
    expect(workingDurationMs(tuesdayEvening, wednesdayMorning, ZONE)).toBe(30 * 60_000);
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
    ], ZONE);

    expect(averages.reviewCount).toBe(1);
    expect(averages.approvalCount).toBe(1);
    expect(averages.reviewMs).toBe(4 * 60 * 60_000);
    expect(averages.approvalMs).toBe(6 * 60 * 60_000);
  });

  it("no promedia un pull request completado sin revisor obligatorio", () => {
    const averages = reviewTimeAverages(
      [
        row({
          reviewerId: null,
          reviewerName: "—",
          reviewedAt: null,
          approvedAt: null,
          isCompleted: true,
          status: "pending_review",
        }),
      ],
      ZONE,
    );

    expect(averages.reviewCount).toBe(0);
    expect(averages.approvalCount).toBe(0);
    expect(averages.approvalMs).toBeNull();
  });

  it("promedia la primera aprobación requerida una vez por pull request", () => {
    const averages = reviewTimeAverages(
      [
        row({
          reviewerId: "ana",
          approvedAt: "2026-10-20T20:00:00.000Z",
        }),
        row({
          reviewerId: "luis",
          reviewerName: "Luis",
          approvedAt: "2026-10-20T18:00:00.000Z",
        }),
      ],
      ZONE,
    );

    expect(averages.approvalCount).toBe(1);
    expect(averages.approvalMs).toBe(4 * 60 * 60_000);
  });

  it("promedia la primera revisión una vez por pull request", () => {
    const averages = reviewTimeAverages(
      [
        row({
          reviewerId: "ana",
          reviewedAt: "2026-10-20T18:00:00.000Z",
        }),
        row({
          reviewerId: "luis",
          reviewerName: "Luis",
          reviewedAt: "2026-10-20T16:00:00.000Z",
        }),
      ],
      ZONE,
    );

    expect(averages.reviewCount).toBe(1);
    expect(averages.reviewMs).toBe(2 * 60 * 60_000);
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

  it("no toma comentarios de Sonar como revisor cuando no hay requerido", () => {
    const rows = buildReviewTimeRows({
      pullRequest: {
        ...pullRequest(),
        isCompleted: true,
        reviewers: [],
      },
      signals: [
        {
          authorId: "sonar",
          authorName: "Miguel Angel Barrera Ospina",
          publishedAt: "2026-10-20T18:00:00.000Z",
          kind: "text",
          vote: null,
        },
      ],
      policies: [],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.reviewerName).toBe("—");
    expect(rows[0]?.reviewerId).toBeNull();
    expect(rows[0]?.approvedAt).toBeNull();
    expect(rows[0]?.isCompleted).toBe(true);
  });

  it("deja la rayita cuando no hay revisor obligatorio", () => {
    const [built] = buildReviewTimeRows({
      pullRequest: { ...pullRequest(), reviewers: [] },
      signals: [],
      policies: [],
    });

    expect(built?.reviewerId).toBeNull();
    expect(built?.reviewerName).toBe("—");
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

  it("conserva como máximo tres meses válidos", () => {
    expect(monthWindow("2026-all", "America/Bogota")).toBeNull();
    expect(
      normalizeMonthKeys(
        ["2026-12", "2026-01", "2026-all", "2026-06", "2026-03"],
        "America/Bogota",
      ),
    ).toEqual(["2026-01", "2026-03", "2026-06"]);
    expect(
      normalizeMonthKeys(["2025-12", "2026-01", "2026-02"], "America/Bogota"),
    ).toEqual(["2025-12"]);
    expect(normalizeMonthKeys([], "America/Bogota", new Date("2026-10-20T15:00:00.000Z"))).toEqual([
      "2026-10",
    ]);
  });

  it("resuelve el mes actual en la zona del proyecto", () => {
    expect(currentMonthKey("America/Bogota", new Date("2026-10-20T15:00:00.000Z"))).toBe("2026-10");
  });
});
