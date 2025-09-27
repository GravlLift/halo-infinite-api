import { MatchInfo } from "./match-info";
import { MatchOutcome } from "./match-outcome";

export interface PlayerMatchHistory {
  MatchId: string;
  LastTeamId: number;
  Outcome: MatchOutcome;
  Rank: number;
  PresentAtEndOfMatch: boolean;
  MatchInfo: MatchInfo;
}
