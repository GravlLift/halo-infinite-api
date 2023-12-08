import { GameVariantCategory } from "./game-variant-category";

export interface OddballStats {
  KillsAsSkullCarrier: number;
  LongestTimeAsSkullCarrier: string;
  SkullCarriersKilled: number;
  SkullGrabs: number;
  TimeAsSkullCarrier: string;
  SkullScoringTicks: number;
}

export interface ZonesStats {
  StrongholdCaptures: number;
  StrongholdDefensiveKills: number;
  StrongholdOffensiveKills: number;
  StrongholdSecures: number;
  StrongholdOccupationTime: string;
  StrongholdScoringTicks: number;
}

export interface CaptureTheFlagStats {
  FlagCaptureAssists: number;
  FlagCaptures: number;
  FlagCarriersKilled: number;
  FlagGrabs: number;
  FlagReturnersKilled: number;
  FlagReturns: number;
  FlagSecures: number;
  FlagSteals: number;
  KillsAsFlagCarrier: number;
  KillsAsFlagReturner: number;
  TimeAsFlagCarrier: string;
}

export interface ExtractionStats {
  SuccessfulExtractions: number;
  ExtractionConversionsDenied: number;
  ExtractionConversionsCompleted: number;
  ExtractionInitiationsDenied: number;
  ExtractionInitiationsCompleted: number;
}

export interface EliminationStats {
  AlliesRevived: number;
  EliminationAssists: number;
  Eliminations: number;
  EnemyRevivesDenied: number;
  Executions: number;
  KillsAsLastPlayerStanding: number;
  LastPlayersStandingKilled: number;
  RoundsSurvived: number;
  TimesRevivedByAlly: number;
}

export interface InfectionStats {
  AlphasKilled: number;
  SpartansInfected: number;
  SpartansInfectedAsAlpha: number;
  KillsAsLastSpartanStanding: number;
  LastSpartansStandingInfected: number;
  RoundsAsAlpha: number;
  RoundsAsLastSpartanStanding: number;
  RoundsFinishedAsInfected: number;
  RoundsSurvivedAsSpartan: number;
  RoundsSurvivedAsLastSpartanStanding: number;
  TimeAsLastSpartanStanding: string;
  InfectedKilled: number;
}

export interface StockpileStats {
  KillsAsPowerSeedCarrier: number;
  PowerSeedCarriersKilled: number;
  PowerSeedsDeposited: number;
  PowerSeedsStolen: number;
  TimeAsPowerSeedCarrier: string;
  TimeAsPowerSeedDriver: string;
}

type StatsMap = {
  [GameVariantCategory.MultiplayerOddball]: { OddballStats: OddballStats };
  [GameVariantCategory.MultiplayerStrongholds]: { ZonesStats: ZonesStats };
  [GameVariantCategory.MultiplayerCtf]: {
    CaptureTheFlagStats: CaptureTheFlagStats;
  };
  [GameVariantCategory.MultiplayerKingOfTheHill]: { ZonesStats: ZonesStats };
  [GameVariantCategory.MultiplayerExtraction]: {
    ExtractionStats: ExtractionStats;
  };
  [GameVariantCategory.MultiplayerFirefight]: {
    EliminationStats: EliminationStats;
  };
  [GameVariantCategory.MultiplayerInfection]: {
    InfectionSTats: InfectionStats;
  };
  [GameVariantCategory.MultiplayerStockpile]: {
    StockpileStats: StockpileStats;
  };
};

export type Stats<TCategory extends GameVariantCategory = GameVariantCategory> =
  {
    CoreStats: {
      Score: number;
      PersonalScore: number;
      RoundsWon: number;
      RoundsLost: number;
      RoundsTied: number;
      Kills: number;
      Deaths: number;
      Assists: number;
      KDA: number;
      Suicides: number;
      Betrayals: number;
      AverageLifeDuration: string;
      GrenadeKills: number;
      HeadshotKills: number;
      MeleeKills: number;
      PowerWeaponKills: number;
      ShotsFired: number;
      ShotsHit: number;
      Accuracy: number;
      DamageDealt: number;
      DamageTaken: number;
      CalloutAssists: number;
      VehicleDestroys: number;
      DriverAssists: number;
      Hijacks: number;
      EmpAssists: number;
      MaxKillingSpree: number;
      Medals: {
        NameId: number;
        Count: number;
        TotalPersonalScoreAwarded: number;
      }[];
      PersonalScores: {
        NameId: number;
        Count: number;
        TotalPersonalScoreAwarded: number;
      }[];
      DeprecatedDamageDealt: number;
      DeprecatedDamageTaken: number;
      Spawns: number;
      ObjectivesCompleted: number;
    };
  } & (TCategory extends keyof StatsMap ? StatsMap[TCategory] : {});
