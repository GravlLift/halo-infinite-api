import { ApiFormattedDate } from "./api-formatted-date";

export interface Asset {
  Tags: string[];
  AssetId: string;
  VersionId: string;
  PublicName: string;
  Description: string;
  Files: {
    Prefix: string;
    FileRelativePaths: string[];
    PrefixEndpoint: {
      AuthorityId: string;
      Path: string;
      QueryString: any;
      RetryPolicyId: string;
      TopicName: string;
      AcknowledgementTypeId: number;
      AuthenticationLifetimeExtensionSupported: boolean;
      ClearanceAware: boolean;
    };
  };
  Contributors: string[];
  AssetHome: number;
  AssetStats: {
    PlaysRecent: number;
    PlaysAllTime: number;
    Favorites: number;
    Likes: number;
    Bookmarks: number;
    ParentAssetCount: number;
    AverageRating: number;
    NumberOfRatings: number;
  };
  InspectionResult: number;
  CloneBehavior: number;
  Order: number;
  PublishedDate: ApiFormattedDate;
  VersionNumber: number;
  Admin: string;
}

export interface MapAsset extends Asset {
  CustomData: {
    NumOfObjectsOnMap: number;
    TagLevelId: number;
    IsBaked: boolean;
    HasNodeGraph: boolean;
  };
  PrefabLinks: unknown[];
}

export interface UgcGameVariantAsset extends Asset {
  CustomData: {
    KeyValues: object;
    HasNodeGraph: boolean;
  };
  EngineGameVariantLink?: Asset;
}
