import { GameVariantCategory } from "./game-variant-category";

interface OddballStats {
  KillsAsSkullCarrier: number;
  LongestTimeAsSkullCarrier: string;
  SkullCarriersKilled: number;
  SkullGrabs: number;
  TimeAsSkullCarrier: string;
  SkullScoringTicks: number;
}
interface ZonesStats {
  StrongholdCaptures: number;
  StrongholdDefensiveKills: number;
  StrongholdOffensiveKills: number;
  StrongholdSecures: number;
  StrongholdOccupationTime: string;
  StrongholdScoringTicks: number;
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
type StatsMap = {
  [GameVariantCategory.MultiplayerOddball]: { OddballStats: OddballStats };
  [GameVariantCategory.MultiplayerStrongholds]: { ZonesStats: ZonesStats };
  [GameVariantCategory.MultiplayerCtf]: {
    CaptureTheFlagStats: CaptureTheFlagStats;
  };
  [GameVariantCategory.MultiplayerKingOfTheHill]: { ZonesStats: ZonesStats };
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
