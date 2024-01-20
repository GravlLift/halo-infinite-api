import { ApiFormattedDate } from "./api-formatted-date";

export enum ProgressionFileType {
  Seasons = "Seasons",
  Calendars = "Calendars",
  "Csr/Seasons" = "Csr/Seasons",
}

export type ProgressionFileTypeMap = {
  Calendars: SeasonCalendarProgressionFile;
  Seasons: SeasonProgressionFile;
  ["Csr/Seasons"]: CsrSeasonCalendarProgressionFile;
};

export interface SeasonCalendarProgressionFile {
  Seasons: {
    CsrSeasonFilePath: `Csr/Seasons/${string}.json`;
    OperationTrackPath: `RewardTracks/Operations/${string}.json`;
    SeasonMetadata: `Seasons/${string}.json`;
    StartDate: ApiFormattedDate;
    EndDate: ApiFormattedDate;
  }[];
  Events: {
    RewardTrackPath: `RewardTracks/Events/Rituals/${string}.json`;
    StartDate: ApiFormattedDate;
    EndDate: ApiFormattedDate;
  }[];
  CareerRank: { RewardTrackPath: `RewardTracks/CareerRanks/${string}.json` };
}

export interface CsrSeasonCalendarProgressionFile {
  Seasons: {
    CsrSeasonFilePath: `Csr/Seasons/${string}.json`;
    StartDate: ApiFormattedDate;
    EndDate: ApiFormattedDate;
  }[];
}

export interface SeasonProgressionFile {
  DateRange: string;
  Name: string;
  Logo: string;
  Number: number;
  Description: string;
  SummaryBackgroundPath: string;
  BattlePassSeasonUpsellBackgroundImage: string;
  ChallengesBackgroundPath: string;
  BattlePassLogoImage: string;
  SeasonLogoImage: string;
  RitualLogoImage: string;
  StorefrontBackgroundImage: string;
  CardBackgroundImage: string;
  ProgressionBackgroundImage: string;
}
