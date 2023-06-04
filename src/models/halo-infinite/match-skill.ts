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
  Kills: number;
  Deaths: number;
}

export interface MatchSkill {
  TeamId: number;
  TeamMmr: number;
  TeamMmrs: {
    [key: number]: number;
  };
  RankRecap: {
    PreMatchCsr: CsrObject;
    PostMatchCsr: CsrObject;
  };
  StatPerformances: {
    Kills: StatPerformance;
    Deaths: StatPerformance;
  };
  Counterfactuals: {
    SelfCounterfactual: Counterfactual;
    TierCounterfactuals: {
      Bronze: Counterfactual;
      Silver: Counterfactual;
      Gold: Counterfactual;
      Platinum: Counterfactual;
      Diamond: Counterfactual;
      Onyx: Counterfactual;
    };
  };
}
