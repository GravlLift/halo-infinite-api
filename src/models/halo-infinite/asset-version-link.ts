import { AssetKind } from "./asset-kind.js";

export interface AssetVersionLink {
  AssetKind: AssetKind;
  AssetId: string;
  VersionId: string;
}
