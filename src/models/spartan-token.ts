import { ApiFormattedDate } from "./halo-infinite/api-formatted-date";

export interface SpartanToken {
  SpartanToken: string;
  ExpiresUtc: ApiFormattedDate;
  TokenDuration: string;
}
