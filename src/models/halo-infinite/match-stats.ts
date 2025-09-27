import { GameVariantCategory } from "./game-variant-category";
import { MatchInfo } from "./match-info";
import { MatchOutcome } from "./match-outcome";
import { Stats } from "./stats";

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
