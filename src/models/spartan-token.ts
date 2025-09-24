import { ApiFormattedDate } from "./halo-infinite/api-formatted-date.js";

export interface SpartanToken {
  SpartanToken: string;
  ExpiresUtc: ApiFormattedDate;
  TokenDuration: string;
}
