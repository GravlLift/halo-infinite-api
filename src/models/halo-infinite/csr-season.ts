import { ApiFormattedDate } from "./api-formatted-date";

export interface CsrSeasonCalendarContainer {
  Seasons: {
    CsrSeasonFilePath: string;
    StartDate: ApiFormattedDate;
    EndDate: ApiFormattedDate;
  }[];
}
