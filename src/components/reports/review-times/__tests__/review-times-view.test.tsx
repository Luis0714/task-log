import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ApprovalDuration,
  FirstReviewDuration,
  ReviewDate,
} from "@/components/reports/review-times/review-duration";
import { ReviewTimesColumnHint } from "@/components/reports/review-times/review-times-column-hint";
import { ReviewTimesPullRequestLink } from "@/components/reports/review-times/review-times-pull-request-link";
import { ReviewTimesReviewerLine } from "@/components/reports/review-times/review-times-reviewer-line";
import { ReviewTimesRowCard } from "@/components/reports/review-times/review-times-row-card";
import { ReviewTimesTable } from "@/components/reports/review-times/review-times-table";
import type { ReviewTimeRow } from "@/lib/review-times/types";

const TIME_ZONE = "America/Bogota";

function html(node: ReactElement): string {
  return renderToStaticMarkup(node);
}

function row(overrides: Partial<ReviewTimeRow> = {}): ReviewTimeRow {
  return {
    pullRequestId: 22933,
    title: "Comentarios y arreglos",
    repository: "STUDIA-LMS-WEB",
    authorId: "author-1",
    authorName: "Hans Stivens Ovalle Ortega",
    reviewerId: "reviewer-1",
    reviewerName: "Luis Andres Martinez Estremor",
    createdAt: "2026-10-21T15:54:00.000Z",
    reviewedAt: "2026-10-21T16:04:00.000Z",
    approvedAt: "2026-10-21T17:00:00.000Z",
    readyAt: null,
    readyState: "none",
    isDraft: false,
    isCompleted: false,
    status: "approved",
    ...overrides,
  };
}

describe("ReviewDate", () => {
  it("muestra la rayita cuando no hay fecha", () => {
    expect(html(createElement(ReviewDate, { iso: null, timeZone: TIME_ZONE }))).toContain("—");
  });

  it("formatea la fecha en doce horas", () => {
    const markup = html(
      createElement(ReviewDate, { iso: "2026-10-21T15:54:00.000Z", timeZone: TIME_ZONE }),
    );
    expect(markup).toContain("21 de oct");
    expect(markup).toContain("AM");
  });
});

describe("FirstReviewDuration", () => {
  it("muestra la duración cuando ya hubo primera revisión", () => {
    const markup = html(
      createElement(FirstReviewDuration, {
        row: row(),
        firstReviewedAt: "2026-10-21T16:04:00.000Z",
        timeZone: TIME_ZONE,
      }),
    );
    expect(markup).toContain("min");
  });

  it("muestra la rayita si la revisión no se puede medir", () => {
    const markup = html(
      createElement(FirstReviewDuration, {
        row: row({ createdAt: "fecha-invalida" }),
        firstReviewedAt: "tambien-invalida",
        timeZone: TIME_ZONE,
      }),
    );
    expect(markup).toContain("—");
  });

  it("muestra la rayita sin revisor o si el pull request ya se completó", () => {
    expect(
      html(
        createElement(FirstReviewDuration, {
          row: row({ reviewerId: null }),
          firstReviewedAt: null,
          timeZone: TIME_ZONE,
        }),
      ),
    ).toContain("—");
    expect(
      html(
        createElement(FirstReviewDuration, {
          row: row({ isCompleted: true }),
          firstReviewedAt: null,
          timeZone: TIME_ZONE,
        }),
      ),
    ).toContain("—");
  });

  it("cuenta el tiempo que lleva abierto", () => {
    const markup = html(
      createElement(FirstReviewDuration, {
        row: row({ reviewedAt: null, approvedAt: null }),
        firstReviewedAt: null,
        timeZone: TIME_ZONE,
      }),
    );
    expect(markup).toContain("Lleva");
  });

  it("muestra la rayita si el tiempo abierto no se puede medir", () => {
    const markup = html(
      createElement(FirstReviewDuration, {
        row: row({ createdAt: "fecha-invalida", reviewedAt: null, approvedAt: null }),
        firstReviewedAt: null,
        timeZone: TIME_ZONE,
      }),
    );
    expect(markup).toContain("—");
  });
});

describe("ApprovalDuration", () => {
  it("muestra la duración hasta la aprobación", () => {
    const markup = html(
      createElement(ApprovalDuration, { row: row(), timeZone: TIME_ZONE }),
    );
    expect(markup).toContain("min");
  });

  it("muestra la rayita si la aprobación no se puede medir", () => {
    const markup = html(
      createElement(ApprovalDuration, {
        row: row({ createdAt: "fecha-invalida", approvedAt: "tambien-invalida" }),
        timeZone: TIME_ZONE,
      }),
    );
    expect(markup).toContain("—");
  });

  it("cuenta cero minutos cuando se completó sin revisor", () => {
    const markup = html(
      createElement(ApprovalDuration, {
        row: row({ reviewerId: null, approvedAt: null, isCompleted: true }),
        timeZone: TIME_ZONE,
      }),
    );
    expect(markup).toContain("0 min");
  });

  it("muestra la rayita cuando sigue abierto y no tiene revisor", () => {
    const markup = html(
      createElement(ApprovalDuration, {
        row: row({ reviewerId: null, approvedAt: null, isCompleted: false }),
        timeZone: TIME_ZONE,
      }),
    );
    expect(markup).toContain("—");
  });

  it("cuenta el tiempo que lleva sin aprobar", () => {
    const markup = html(
      createElement(ApprovalDuration, {
        row: row({ approvedAt: null }),
        timeZone: TIME_ZONE,
      }),
    );
    expect(markup).toContain("Lleva");
  });

  it("muestra la rayita si el tiempo sin aprobar no se puede medir", () => {
    const markup = html(
      createElement(ApprovalDuration, {
        row: row({ createdAt: "fecha-invalida", approvedAt: null }),
        timeZone: TIME_ZONE,
      }),
    );
    expect(markup).toContain("—");
  });
});

describe("ReviewTimesColumnHint", () => {
  it("muestra el título y la descripción", () => {
    const markup = html(
      createElement(ReviewTimesColumnHint, {
        label: "Fecha de creación",
        hint: "Momento en que se abrió el pull request.",
      }),
    );
    expect(markup).toContain("Fecha de creación");
    expect(markup).toContain("Momento en que se abrió el pull request.");
  });
});

describe("ReviewTimesReviewerLine", () => {
  it("pone el nombre del revisor en negrita", () => {
    const markup = html(
      createElement(ReviewTimesReviewerLine, { name: "Luis Andres Martinez Estremor" }),
    );
    expect(markup).toContain("Revisor: Luis Andres Martinez Estremor");
    expect(markup).toContain("font-bold");
  });
});

describe("ReviewTimesPullRequestLink", () => {
  it("abre el pull request en Azure", () => {
    const markup = html(
      createElement(ReviewTimesPullRequestLink, {
        organization: "org",
        project: "NARP",
        repository: "STUDIA-LMS-WEB",
        pullRequestId: 22933,
        title: "Comentarios",
      }),
    );
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain("#22933 Comentarios");
    expect(markup).toContain("dev.azure.com");
  });

  it("trunca el título y conserva el enlace", () => {
    const markup = html(
      createElement(ReviewTimesPullRequestLink, {
        organization: "org",
        project: "NARP",
        repository: "STUDIA-LMS-WEB",
        pullRequestId: 22933,
        title: "Comentarios",
        truncate: true,
      }),
    );
    expect(markup).toContain("truncate");
    expect(markup).toContain("#22933 Comentarios");
  });

  it("muestra el título sin enlace cuando faltan datos", () => {
    const markup = html(
      createElement(ReviewTimesPullRequestLink, {
        organization: "",
        project: "NARP",
        repository: "STUDIA-LMS-WEB",
        pullRequestId: 22933,
        title: "Comentarios",
      }),
    );
    expect(markup).not.toContain("<a ");
    expect(markup).toContain("#22933 Comentarios");
  });

  it("trunca el título aunque no haya enlace", () => {
    const markup = html(
      createElement(ReviewTimesPullRequestLink, {
        organization: "",
        project: "NARP",
        repository: "STUDIA-LMS-WEB",
        pullRequestId: 22933,
        title: "Comentarios",
        truncate: true,
      }),
    );
    expect(markup).toContain("truncate");
    expect(markup).toContain("#22933 Comentarios");
  });
});

describe("ReviewTimesRowCard", () => {
  it("lista el autor, el repositorio y el revisor", () => {
    const markup = html(
      createElement(ReviewTimesRowCard, {
        row: row({ isDraft: true }),
        timeZone: TIME_ZONE,
        organization: "org",
        project: "NARP",
        firstReviewedAt: "2026-10-21T16:04:00.000Z",
      }),
    );
    expect(markup).toContain("Hans Stivens Ovalle Ortega");
    expect(markup).toContain("Borrador");
    expect(markup).toContain("STUDIA-LMS-WEB");
    expect(markup).toContain("Revisor: Luis Andres Martinez Estremor");
  });
});

describe("ReviewTimesTable", () => {
  it("pinta las filas de la tabla y las tarjetas", () => {
    const markup = html(
      createElement(ReviewTimesTable, {
        rows: [
          row({ isDraft: true }),
          row({
            pullRequestId: 22922,
            reviewerId: null,
            reviewerName: "—",
            reviewedAt: null,
            approvedAt: null,
            isCompleted: true,
            isDraft: false,
            status: "pending_review",
          }),
        ],
        timeZone: TIME_ZONE,
        organization: "org",
        project: "NARP",
      }),
    );
    expect(markup).toContain("Pull request");
    expect(markup).toContain("Fecha de creación");
    expect(markup).toContain("#22933 Comentarios y arreglos");
    expect(markup).toContain("Borrador");
    expect(markup).toContain("Revisor: Luis Andres Martinez Estremor");
    expect(markup).toContain("Revisor: —");
    expect(markup).toContain("0 min");
  });
});
