interface CsrObject {
  Value: number;
  MeasurementMatchesRemaining: number;
  Tier: string;
  TierStart: number;
  NextTier: string;
  NextTierStart: number;
  NextSubTier: number;
  InitialMeasurementMatches: number;
}

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
  TeamMmr: number;
  TeamMmrs: {
    [key: number]: number;
  };
  RankRecap: {
    PreMatchCsr: CsrObject;
    PostMatchCsr: CsrObject;
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
