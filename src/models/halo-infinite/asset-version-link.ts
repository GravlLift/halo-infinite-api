import { AssetKind } from "./asset-kind";

export interface AssetVersionLink {
  AssetKind: AssetKind;
  AssetId: string;
  VersionId: string;
}
