import { PlaylistCsr } from "./playlist-csr.js";

interface StatPerformance {
  Count: number;
  Expected: number;
  StdDev: number;
}

interface Counterfactual {
  Kills: number | "NaN";
  Deaths: number | "NaN";
}

export interface MatchSkill<TResult extends 1 | 0 = 0> {
  TeamId: number;
  TeamMmr: number | "Infinity";
  TeamMmrs: {
    [key: number]: number | "Infinity";
  };
  RankRecap: {
    PreMatchCsr: PlaylistCsr;
    PostMatchCsr: PlaylistCsr;
  };
  StatPerformances: TResult extends 0
    ? {
        Kills: StatPerformance;
        Deaths: StatPerformance;
      }
    : {};
  Counterfactuals: TResult extends 0
    ? {
        SelfCounterfactuals: Counterfactual;
        TierCounterfactuals: {
          Bronze: Counterfactual;
          Silver: Counterfactual;
          Gold: Counterfactual;
          Platinum: Counterfactual;
          Diamond: Counterfactual;
          Onyx: Counterfactual;
        };
      }
    : null;
}
