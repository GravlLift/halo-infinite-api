import { DateTime } from "luxon";

export interface SpartanTokenProvider {
  getSpartanToken(): Promise<string>;
  getCurrentExpiration(): Promise<DateTime | null>;
  clearSpartanToken(): Promise<void>;
}
