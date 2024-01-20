export interface ServiceRecord {
  Subqueries: Subqueries;
  TimePlayed: string;
  MatchesCompleted: number;
  Wins: number;
  Losses: number;
  Ties: number;
  CoreStats: CoreStats;
  BombStats: any;
  CaptureTheFlagStats: CaptureTheFlagStats;
  EliminationStats: EliminationStats;
  ExtractionStats: any;
  InfectionStats: any;
  OddballStats: OddballStats;
  ZonesStats: ZonesStats;
  StockpileStats: StockpileStats;
}

interface Subqueries {
  SeasonIds: (`Csr/Seasons/${string}.json` | `Seasons/${string}.json`)[];
  GameVariantCategories: number[];
  IsRanked: boolean[];
  PlaylistAssetIds: string[];
}

interface CoreStats {
  Score: number;
  PersonalScore: number;
  RoundsWon: number;
  RoundsLost: number;
  RoundsTied: number;
  Kills: number;
  Deaths: number;
  Assists: number;
  AverageKDA: number;
  Suicides: number;
  Betrayals: number;
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
  Medals: Medal[];
  PersonalScores: PersonalScore[];
  Spawns: number;
}

interface Medal {
  NameId: number;
  Count: number;
  TotalPersonalScoreAwarded: number;
}

interface PersonalScore {
  NameId: number;
  Count: number;
  TotalPersonalScoreAwarded: number;
}

interface CaptureTheFlagStats {
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

interface EliminationStats {
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

interface OddballStats {
  KillsAsSkullCarrier: number;
  LongestTimeAsSkullCarrier: string;
  SkullCarriersKilled: number;
  SkullGrabs: number;
  TimeAsSkullCarrier: string;
  SkullScoringTicks: number;
}

interface ZonesStats {
  ZoneCaptures: number;
  ZoneDefensiveKills: number;
  ZoneOffensiveKills: number;
  ZoneSecures: number;
  TotalZoneOccupationTime: string;
  ZoneScoringTicks: number;
}

interface StockpileStats {
  KillsAsPowerSeedCarrier: number;
  PowerSeedCarriersKilled: number;
  PowerSeedsDeposited: number;
  PowerSeedsStolen: number;
  TimeAsPowerSeedCarrier: string;
  TimeAsPowerSeedDriver: string;
}
