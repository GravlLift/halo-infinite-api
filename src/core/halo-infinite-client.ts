import { FetchFunction, defaultFetch } from "../util/fetch-function";
import { HaloCoreEndpoints } from "../endpoints/halo-core-endpoints";
import {
  MapAsset,
  PlaylistAsset,
  UgcGameVariantAsset,
} from "../models/halo-infinite/asset";
import { AssetKind } from "../models/halo-infinite/asset-kind";
import { MatchSkill } from "../models/halo-infinite/match-skill";
import { MatchStats } from "../models/halo-infinite/match-stats";
import { MatchType } from "../models/halo-infinite/match-type";
import { PlayerMatchHistory } from "../models/halo-infinite/player-match-history";
import { Playlist } from "../models/halo-infinite/playlist";
import { PlaylistCsrContainer } from "../models/halo-infinite/playlist-csr-container";
import { ServiceRecord } from "../models/halo-infinite/service-record";
import { UserInfo } from "../models/halo-infinite/user-info";
import { GlobalConstants } from "../util/global-contants";
import { SpartanTokenProvider } from "./token-providers/spartan-token-providers";

interface ResultContainer<TValue> {
  Id: string;
  ResultCode: 0 | 1;
  Result: TValue;
}

interface ResultsContainer<TValue> {
  Value: ResultContainer<TValue>[];
}

interface PaginationContainer<TValue> {
  Start: number;
  Count: number;
  ResultCount: number;
  Results: TValue[];
}

export type AssetKindTypeMap = {
  [AssetKind.Map]: MapAsset;
  [AssetKind.UgcGameVariant]: UgcGameVariantAsset;
  [AssetKind.Playlist]: PlaylistAsset;
};

const assetKindUrlMap = {
  [AssetKind.Map]: "Maps",
  [AssetKind.UgcGameVariant]: "UgcGameVariants",
  [AssetKind.Playlist]: "Playlists",
} satisfies {
  [key in keyof AssetKindTypeMap]: string;
};

function wrapPlayerId(playerId: string) {
  if (/^\w+\(\d+\)/.test(playerId)) {
    return playerId;
  } else {
    // Assume xuid
    return `xuid(${playerId})`;
  }
}

function unwrapPlayerId(playerId: string) {
  const match = /^\w+\((\d+)\)$/.exec(playerId);
  if (match) {
    return match[1];
  } else {
    return playerId;
  }
}

export class HaloInfiniteClient {
  constructor(
    private readonly spartanTokenProvider: SpartanTokenProvider,
    private readonly fetchFn: FetchFunction = defaultFetch
  ) {}

  private async executeRequest<T>(
    url: string,
    method: RequestInit["method"],
    useSpartanToken = true,
    useClearance = false,
    userAgent: string = GlobalConstants.HALO_WAYPOINT_USER_AGENT
  ) {
    const headers: HeadersInit = {
      "User-Agent": userAgent,
      Accept: "application/json",
    };

    if (useSpartanToken) {
      headers["x-343-authorization-spartan"] =
        await this.spartanTokenProvider.getSpartanToken();
    }

    if (useClearance) {
      throw new Error("TODO: Implement clearance");
    }

    const result = await this.fetchFn<T>(url, {
      method,
      headers,
    });

    return result;
  }

  private async executeResultsRequest<T>(
    ...args: Parameters<HaloInfiniteClient["executeRequest"]>
  ) {
    const result = await this.executeRequest<ResultsContainer<T>>(...args);

    return result.Value;
  }

  private async executePaginationRequest<T>(
    count: number,
    start: number,
    queryParameters: Record<string, string>,
    ...args: Parameters<HaloInfiniteClient["executeRequest"]>
  ) {
    const [url, ...rest] = args;
    const result = await this.executeRequest<PaginationContainer<T>>(
      `${url}?${new URLSearchParams({
        ...queryParameters,
        count: count.toString(),
        start: start.toString(),
      })}`,
      ...rest
    );

    return result.Results;
  }

  /** Gets playlist Competitive Skill Rank (CSR) for a player or a set of players.
   * @param playlistId - Unique ID for the playlist.
   * @param playerIds - Array of player xuids.
   */
  public getPlaylistCsr = (playlistId: string, playerIds: string[]) =>
    this.executeResultsRequest<PlaylistCsrContainer>(
      `https://${HaloCoreEndpoints.SkillOrigin}.${
        HaloCoreEndpoints.ServiceDomain
      }/hi/playlist/${playlistId}/csrs?players=${playerIds
        .map(wrapPlayerId)
        .join(",")}`,
      "get"
    );

  /** Get gamertag info for a player.
   * @param gamerTag - Gamertag to lookup.
   */
  public getUser = (gamerTag: string) =>
    this.executeRequest<UserInfo>(
      `https://${HaloCoreEndpoints.Profile}.${HaloCoreEndpoints.ServiceDomain}/users/gt(${gamerTag})`,
      "get"
    );

  /** Get gamertag info for several players.
   * @param xuids - Xuids to lookup.
   */
  public getUsers = (xuids: string[]) => {
    return this.executeRequest<UserInfo[]>(
      `https://${HaloCoreEndpoints.Profile}.${
        HaloCoreEndpoints.ServiceDomain
      }/users?xuids=${xuids.map((x) => unwrapPlayerId(x)).join(",")}`,
      "get"
    );
  };

  /** Get service record for a player.
   * @param gamerTag - Gamertag to lookup.
   */
  public getUserServiceRecord = (gamerTag: string) =>
    this.executeRequest<ServiceRecord>(
      `https://${HaloCoreEndpoints.StatsOrigin}.${HaloCoreEndpoints.ServiceDomain}/hi/players/${gamerTag}/Matchmade/servicerecord`,
      "get"
    );

  /** Get playlist information
   * @param playlistId - Unique ID for the playlist.
   */
  public getPlaylist = (playlistId: string) =>
    this.executeRequest<Playlist>(
      `https://${HaloCoreEndpoints.GameCmsOrigin}.${HaloCoreEndpoints.ServiceDomain}/hi/multiplayer/file/playlists/assets/${playlistId}.json`,
      "get"
    );

  public getPlayerMatches = (
    playerXuid: string,
    type: MatchType = MatchType.All,
    count: number = 25,
    start: number = 0
  ) => {
    let params: Record<string, string> = {};
    if (type !== MatchType.All) {
      params.type = type.toString();
    }
    return this.executePaginationRequest<PlayerMatchHistory>(
      count,
      start,
      params,
      `https://${HaloCoreEndpoints.StatsOrigin}.${
        HaloCoreEndpoints.ServiceDomain
      }/hi/players/${wrapPlayerId(playerXuid)}/matches`,
      "get"
    );
  };

  public getPlayerServiceRecord(
    playerXuid: string,
    type: MatchType = MatchType.All
  ) {
    return this.executeRequest<ServiceRecord>(
      `https://${HaloCoreEndpoints.StatsOrigin}.${
        HaloCoreEndpoints.ServiceDomain
      }/hi/players/${wrapPlayerId(playerXuid)}/Matchmade/servicerecord`,
      "get"
    );
  }

  public getMatchStats = (matchId: string) =>
    this.executeRequest<MatchStats>(
      `https://${HaloCoreEndpoints.StatsOrigin}.${HaloCoreEndpoints.ServiceDomain}/hi/matches/${matchId}/stats`,
      "get"
    );

  public getMatchSkill = async (matchId: string, playerIds: string[]) => {
    return await this.executeResultsRequest<MatchSkill>(
      `https://${HaloCoreEndpoints.SkillOrigin}.${
        HaloCoreEndpoints.ServiceDomain
      }/hi/matches/${matchId}/skill?players=${playerIds
        .map(wrapPlayerId)
        .join(",")}`,
      "get"
    );
  };

  /** Gets authoring metadata about a specific asset. */
  public getAsset = <TAssetType extends keyof AssetKindTypeMap>(
    assetType: TAssetType,
    assetId: string
  ) =>
    this.executeRequest<AssetKindTypeMap[TAssetType]>(
      `https://${HaloCoreEndpoints.DiscoveryOrigin}.${HaloCoreEndpoints.ServiceDomain}/hi/${assetKindUrlMap[assetType]}/${assetId}`,
      "get"
    );

  /** Gets metadata related to a concrete version of a specified asset. */
  public getSpecificAssetVersion = <TAssetType extends keyof AssetKindTypeMap>(
    assetType: TAssetType,
    assetId: string,
    versionId: string
  ) =>
    this.executeRequest<AssetKindTypeMap[TAssetType]>(
      `https://${HaloCoreEndpoints.DiscoveryOrigin}.${HaloCoreEndpoints.ServiceDomain}/hi/${assetKindUrlMap[assetType]}/${assetId}/versions/${versionId}`,
      "get"
    );
}
