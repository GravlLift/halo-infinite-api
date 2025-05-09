import { ApiFormattedDate } from "./api-formatted-date";

export interface SeasonCalendarContainer {
  Seasons: {
    CsrSeasonFilePath: string;
    OperationTrackPath: string;
    SeasonMetadata: string;
    StartDate: ApiFormattedDate;
    EndDate: ApiFormattedDate;
  }[];
  Events: {
    RewardTrackPath: string;
    StartDate: ApiFormattedDate;
    EndDate: ApiFormattedDate;
  }[];
  CareerRank: {
    RewardTrackPath: string;
  };
}
