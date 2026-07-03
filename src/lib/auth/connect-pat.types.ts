export type ConnectPatFormValues = {
  pat: string;
  organization: string;
  project: string;
  team: string;
  adoUrl: string;
};

export const EMPTY_CONNECT_PAT_VALUES: ConnectPatFormValues = {
  pat: "",
  organization: "",
  project: "",
  team: "",
  adoUrl: "",
};
