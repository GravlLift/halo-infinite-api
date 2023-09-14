import { AssetVersionLink } from "./asset-version-link";
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
  MapVariant: AssetVersionLink;
  UgcGameVariant: AssetVersionLink;
  ClearanceId: string;
  Playlist: AssetVersionLink;
  PlaylistExperience: PlaylistExperience;
  PlaylistMapModePair: AssetVersionLink;
  SeasonId: string;
  PlayableDuration: string;
  TeamsEnabled: boolean;
  TeamScoringEnabled: boolean;
}
