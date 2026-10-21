"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { PersonOption } from "@/lib/review-times/person-options";
import {
  applyReviewTimesSearchParams,
  parseReviewTimesSearchParams,
  type ParseReviewTimesOptions,
  type ReviewTimesUrlState,
} from "@/lib/review-times/search-params";
import type { ReviewTimeStatus } from "@/lib/review-times/types";

const REPOSITORY_NAVIGATION_DELAY_MS = 400;

type ReviewTimesPeople = {
  reviewerOptions: PersonOption[];
  authorOptions: PersonOption[];
};

type ReviewTimesUrlContextValue = {
  state: ReviewTimesUrlState;
  isNavigating: boolean;
  people: ReviewTimesPeople;
  setPeople: (people: ReviewTimesPeople) => void;
  setMonthKeys: (monthKeys: string[]) => void;
  setRepositories: (repositories: string[]) => void;
  setReviewerIds: (reviewerIds: string[]) => void;
  setAuthorIds: (authorIds: string[]) => void;
  setStatuses: (statuses: ReviewTimeStatus[]) => void;
  setSearch: (search: string) => void;
};

const EMPTY_PEOPLE: ReviewTimesPeople = { reviewerOptions: [], authorOptions: [] };

const ReviewTimesUrlContext = createContext<ReviewTimesUrlContextValue | null>(null);

function searchParamsRecord(searchParams: URLSearchParams): Record<string, string[]> {
  const raw: Record<string, string[]> = {};
  for (const key of searchParams.keys()) raw[key] = searchParams.getAll(key);
  return raw;
}

function hrefFor(pathname: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function ReviewTimesUrlProvider({
  timeZone,
  defaultRepository,
  knownRepositories,
  children,
}: Readonly<{
  timeZone: string;
  defaultRepository: string | null;
  knownRepositories: readonly string[];
  children: ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const parseOptions = useMemo<ParseReviewTimesOptions>(
    () => ({ timeZone, defaultRepository, knownRepositories }),
    [defaultRepository, knownRepositories, timeZone],
  );
  const [state, setState] = useState(() =>
    parseReviewTimesSearchParams(searchParamsRecord(searchParams), parseOptions).state,
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const [people, setPeople] = useState<ReviewTimesPeople>(EMPTY_PEOPLE);
  const repositoryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  const locationRef = useRef({ pathname, query });
  const routerRef = useRef(router);
  stateRef.current = state;
  locationRef.current = { pathname, query };
  routerRef.current = router;

  useEffect(() => {
    const parsed = parseReviewTimesSearchParams(
      searchParamsRecord(new URLSearchParams(query)),
      parseOptions,
    );
    setState(parsed.state);
    setIsNavigating(false);
  }, [parseOptions, query]);

  useEffect(() => {
    return () => {
      if (repositoryTimer.current) clearTimeout(repositoryTimer.current);
    };
  }, []);

  const publish = (next: ReviewTimesUrlState, mode: "navigate" | "shallow") => {
    const { pathname: currentPath, query: currentQuery } = locationRef.current;
    const params = applyReviewTimesSearchParams(new URLSearchParams(currentQuery), next);
    const href = hrefFor(currentPath, params);
    const currentHref = hrefFor(currentPath, new URLSearchParams(currentQuery));
    setState(next);
    if (href === currentHref) return;
    if (mode === "shallow") {
      window.history.replaceState(null, "", href);
      locationRef.current = { pathname: currentPath, query: params.toString() };
      return;
    }
    setIsNavigating(true);
    routerRef.current.replace(href, { scroll: false });
  };

  const publishRef = useRef(publish);
  publishRef.current = publish;

  const value = useMemo<ReviewTimesUrlContextValue>(
    () => ({
      state,
      isNavigating,
      people,
      setPeople,
      setMonthKeys: (monthKeys) => {
        const next = { ...stateRef.current, monthKeys };
        stateRef.current = next;
        setState(next);
        if (repositoryTimer.current) clearTimeout(repositoryTimer.current);
        repositoryTimer.current = setTimeout(() => {
          publishRef.current(stateRef.current, "navigate");
        }, REPOSITORY_NAVIGATION_DELAY_MS);
      },
      setRepositories: (repositories) => {
        const next = {
          ...stateRef.current,
          repositories,
          allRepositories: repositories.length === 0,
        };
        stateRef.current = next;
        setState(next);
        if (repositoryTimer.current) clearTimeout(repositoryTimer.current);
        repositoryTimer.current = setTimeout(() => {
          publishRef.current(
            {
              ...stateRef.current,
              repositories,
              allRepositories: repositories.length === 0,
            },
            "navigate",
          );
        }, REPOSITORY_NAVIGATION_DELAY_MS);
      },
      setReviewerIds: (reviewerIds) =>
        publishRef.current({ ...stateRef.current, reviewerIds }, "shallow"),
      setAuthorIds: (authorIds) =>
        publishRef.current({ ...stateRef.current, authorIds }, "shallow"),
      setStatuses: (statuses) =>
        publishRef.current({ ...stateRef.current, statuses }, "shallow"),
      setSearch: (search) => publishRef.current({ ...stateRef.current, search }, "shallow"),
    }),
    [isNavigating, people, state],
  );

  return (
    <ReviewTimesUrlContext.Provider value={value}>{children}</ReviewTimesUrlContext.Provider>
  );
}

export function useReviewTimesUrl(): ReviewTimesUrlContextValue {
  const value = useContext(ReviewTimesUrlContext);
  if (!value) {
    throw new Error("useReviewTimesUrl debe usarse dentro de ReviewTimesUrlProvider.");
  }
  return value;
}
