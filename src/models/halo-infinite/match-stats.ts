import { GameVariantCategory } from "./game-variant-category.js";
import { MatchInfo } from "./match-info.js";
import { MatchOutcome } from "./match-outcome.js";
import { Stats } from "./stats.js";

export interface MatchStats<
  TCategory extends GameVariantCategory = GameVariantCategory
> {
  MatchId: string;
  MatchInfo: MatchInfo<TCategory>;
  Teams: {
    TeamId: number;
    Outcome: number;
    Rank: number;
    Stats: Stats<TCategory>;
  }[];
  Players: {
    PlayerId: string;
    PlayerType: number;
    BotAttributes: object;
    LastTeamId: number;
    Outcome: MatchOutcome;
    Rank: number;
    ParticipationInfo: {
      FirstJoinedTime: string;
      LastLeaveTime: string | null;
      PresentAtBeginning: boolean;
      JoinedInProgress: boolean;
      LeftInProgress: boolean;
      PresentAtCompletion: boolean;
      TimePlayed: string;
      ConfirmedParticipation: boolean | null;
    };
    PlayerTeamStats: {
      TeamId: number;
      Stats: Stats<TCategory>;
    }[];
  }[];
}
