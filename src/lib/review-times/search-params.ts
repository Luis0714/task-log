import { normalizeMonthKeys } from "@/lib/review-times/month";
import {
  REVIEW_TIME_STATUSES,
  type ReviewTimeLocalFilters,
  type ReviewTimeStatus,
} from "@/lib/review-times/types";

export const REVIEW_TIMES_PATH = "/reports/review-times";

const MONTH_PARAM = "month";
const REPOSITORY_PARAM = "repository";
const REPOS_SCOPE_PARAM = "repos";
const ALL_REPOSITORIES = "all";
const REVIEWER_PARAM = "reviewer";
const AUTHOR_PARAM = "author";
const STATUS_PARAM = "status";
const SEARCH_PARAM = "q";

export type ReviewTimesUrlState = {
  monthKeys: readonly string[];
  repositories: readonly string[];
  allRepositories: boolean;
  reviewerIds: readonly string[];
  authorIds: readonly string[];
  statuses: readonly ReviewTimeStatus[];
  search: string;
};

export type ParseReviewTimesOptions = {
  timeZone: string;
  defaultRepository: string | null;
  knownRepositories: readonly string[];
  now?: Date;
};

type SearchParamValue = string | string[] | undefined;
type SearchParamRecord = Record<string, SearchParamValue>;

function first(raw: SearchParamValue): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ?? "";
}

function uniqueValues(raw: SearchParamValue): string[] {
  let values: string[] = [];
  if (Array.isArray(raw)) values = raw;
  else if (raw) values = [raw];
  const unique: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || unique.includes(trimmed)) continue;
    unique.push(trimmed);
  }
  return unique;
}

function sameMembers(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

function isReviewStatus(value: string): value is ReviewTimeStatus {
  return (REVIEW_TIME_STATUSES as readonly string[]).includes(value);
}

export function parseReviewTimesSearchParams(
  raw: SearchParamRecord,
  options: ParseReviewTimesOptions,
): { state: ReviewTimesUrlState; isCanonical: boolean } {
  const requestedMonths = uniqueValues(raw[MONTH_PARAM]);
  const monthKeys = normalizeMonthKeys(requestedMonths, options.timeZone, options.now);
  const monthsMatch =
    requestedMonths.length === monthKeys.length && sameMembers(requestedMonths, monthKeys);

  const explicitAll = first(raw[REPOS_SCOPE_PARAM]) === ALL_REPOSITORIES;
  const listed = uniqueValues(raw[REPOSITORY_PARAM]);
  const defaultName = options.defaultRepository?.trim() || null;
  const defaultIsKnown = Boolean(
    defaultName && options.knownRepositories.includes(defaultName),
  );

  const knownListed = listed.filter((name) => options.knownRepositories.includes(name));
  let repositories = knownListed;
  if (explicitAll) {
    repositories = [];
  } else if (listed.length === 0 && defaultIsKnown && defaultName) {
    repositories = [defaultName];
  }
  const allRepositories = repositories.length === 0;

  const state: ReviewTimesUrlState = {
    monthKeys,
    repositories,
    allRepositories,
    reviewerIds: uniqueValues(raw[REVIEWER_PARAM]),
    authorIds: uniqueValues(raw[AUTHOR_PARAM]),
    statuses: uniqueValues(raw[STATUS_PARAM]).filter(isReviewStatus),
    search: first(raw[SEARCH_PARAM]),
  };

  const repositoriesMatch = allRepositories
    ? listed.length === 0
    : !explicitAll && sameMembers(listed, repositories);

  return {
    state,
    isCanonical: monthsMatch && repositoriesMatch,
  };
}

export function toLocalFilters(state: ReviewTimesUrlState): ReviewTimeLocalFilters {
  return {
    reviewerIds: state.reviewerIds,
    authorIds: state.authorIds,
    statuses: state.statuses,
    search: state.search,
  };
}

function replaceList(params: URLSearchParams, key: string, values: readonly string[]) {
  params.delete(key);
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed) params.append(key, trimmed);
  }
}

export function applyReviewTimesSearchParams(
  current: URLSearchParams,
  state: ReviewTimesUrlState,
): URLSearchParams {
  const params = new URLSearchParams(current.toString());
  replaceList(params, MONTH_PARAM, state.monthKeys);
  params.delete(REPOSITORY_PARAM);
  params.delete(REPOS_SCOPE_PARAM);
  if (state.allRepositories) {
    params.set(REPOS_SCOPE_PARAM, ALL_REPOSITORIES);
  } else {
    replaceList(params, REPOSITORY_PARAM, state.repositories);
  }
  replaceList(params, REVIEWER_PARAM, state.reviewerIds);
  replaceList(params, AUTHOR_PARAM, state.authorIds);
  replaceList(params, STATUS_PARAM, state.statuses);
  const search = state.search.trim();
  if (search) params.set(SEARCH_PARAM, search);
  else params.delete(SEARCH_PARAM);
  return params;
}

export function recordToSearchParams(raw: SearchParamRecord): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") {
      params.append(key, value);
      continue;
    }
    if (!Array.isArray(value)) continue;
    for (const item of value) params.append(key, item);
  }
  return params;
}

export function reviewTimesHref(params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${REVIEW_TIMES_PATH}?${query}` : REVIEW_TIMES_PATH;
}
