import { GameVariantCategory } from "./game-variant-category";
import { PlaylistExperience } from "./playlist-experience";
export interface MatchInfo<
  TCategory extends GameVariantCategory = GameVariantCategory
> {
  StartTime: string;
  EndTime: string;
  Duration: string;
  LifecycleMode: number;
  GameVariantCategory: TCategory;
  LevelId: string;
  MapVariant: {
    AssetKind: number;
    AssetId: string;
    VersionId: string;
  };
  UgcGameVariant: {
    AssetKind: number;
    AssetId: string;
    VersionId: string;
  };
  ClearanceId: string;
  Playlist: {
    AssetKind: number;
    AssetId: string;
    VersionId: string;
  };
  PlaylistExperience: PlaylistExperience;
  PlaylistMapModePair: {
    AssetKind: number;
    AssetId: string;
    VersionId: string;
  };
  SeasonId: string;
  PlayableDuration: string;
  TeamsEnabled: boolean;
  TeamScoringEnabled: boolean;
}
