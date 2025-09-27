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

export interface VIPStats {
  VipKills: number;
  VipAssists: number;
  KillsAsVip: number;
  TimesSelectedAsVip: number;
  MaxKillingSpreeAsVip: number;
  LongestTimeAsVip: string;
  TimeAsVip: string;
}

export interface PvpStats {
  Kills: number;
  Deaths: number;
  Assists: number;
  KDA: number;
}

export interface PveStats {
  Kills: number;
  Deaths: number;
  Assists: number;
  KDA: number;
  MarineKills: number;
  GruntKills: number;
  JackalKills: number;
  EliteKills: number;
  BruteKills: number;
  HunterKills: number;
  SkimmerKills: number;
  SentinelKills: number;
  BossKills: number;
}

type StatsMap = {
  [GameVariantCategory.MultiplayerOddball]: {
    OddballStats: OddballStats;
    PvpStats: PvpStats;
  };
  [GameVariantCategory.MultiplayerStrongholds]: {
    ZonesStats: ZonesStats;
    PvpStats: PvpStats;
  };
  [GameVariantCategory.MultiplayerCtf]: {
    CaptureTheFlagStats: CaptureTheFlagStats;
    PvpStats: PvpStats;
  };
  [GameVariantCategory.MultiplayerKingOfTheHill]: {
    ZonesStats: ZonesStats;
    PvpStats: PvpStats;
  };
  [GameVariantCategory.MultiplayerExtraction]: {
    ExtractionStats: ExtractionStats;
    PvpStats: PvpStats;
  };
  [GameVariantCategory.MultiplayerFirefight]: {
    EliminationStats: EliminationStats;
    PveStats: PveStats;
  };
  [GameVariantCategory.MultiplayerInfection]: {
    InfectionSTats: InfectionStats;
    PvpStats: PvpStats;
  };
  [GameVariantCategory.MultiplayerVIP]: {
    VipStats: VIPStats;
    PvpStats: PvpStats;
  };
  [GameVariantCategory.MultiplayerStockpile]: {
    StockpileStats: StockpileStats;
    PvpStats: PvpStats;
  };
  [GameVariantCategory.MultiplayerElimination]: {
    EliminationStats: EliminationStats;
    PvpStats: PvpStats;
  };
  [GameVariantCategory.MultiplayerMinigame]: {
    PvpStats: PvpStats;
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
