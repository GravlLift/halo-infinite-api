import { AssetVersionLink } from "./asset-version-link";
import { GameVariantCategory } from "./game-variant-category";
import { PlaylistExperience } from "./playlist-experience";
export interface MatchInfo<
  TCategory extends GameVariantCategory = GameVariantCategory,
  TResult extends 1 | 0 = 0
> {
  StartTime: string;
  EndTime: string;
  Duration: string;
  LifecycleMode: number;
  GameVariantCategory: TCategory;
  LevelId: string;
  MapVariant: AssetVersionLink;
  UgcGameVariant: AssetVersionLink;
  ClearanceId: string;
  Playlist: AssetVersionLink | null;
  PlaylistExperience: TResult extends 0 ? PlaylistExperience : null;
  PlaylistMapModePair: TResult extends 0 ? AssetVersionLink : null;
  SeasonId: TResult extends 0 ? string : null;
  PlayableDuration: string;
  TeamsEnabled: boolean;
  TeamScoringEnabled: boolean;
}
