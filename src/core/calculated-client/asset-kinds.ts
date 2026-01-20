import {
  MapAsset,
  UgcGameVariantAsset,
  PlaylistAsset,
  MapModePairAsset,
} from "../../models/halo-infinite/asset";
import { AssetKind } from "../../models/halo-infinite/asset-kind";

export const assetKindUrlMap = {
  [AssetKind.Map]: "Maps" as const,
  [AssetKind.UgcGameVariant]: "UgcGameVariants" as const,
  [AssetKind.Playlist]: "Playlists" as const,
  [AssetKind.MapModePair]: "MapModePairs" as const,
} satisfies {
  [key in keyof AssetKindTypeMap]: string;
};
export type AssetKindTypeMap = {
  [AssetKind.Map]: MapAsset;
  [AssetKind.UgcGameVariant]: UgcGameVariantAsset;
  [AssetKind.Playlist]: PlaylistAsset;
  [AssetKind.MapModePair]: MapModePairAsset;
};
