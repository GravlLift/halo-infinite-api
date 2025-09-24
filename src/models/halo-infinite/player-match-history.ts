import { MatchInfo } from "./match-info.js";
import { MatchOutcome } from "./match-outcome.js";

export interface PlayerMatchHistory {
  MatchId: string;
  LastTeamId: number;
  Outcome: MatchOutcome;
  Rank: number;
  PresentAtEndOfMatch: boolean;
  MatchInfo: MatchInfo;
}
