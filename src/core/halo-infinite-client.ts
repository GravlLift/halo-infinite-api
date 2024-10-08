import { FetchFunction, defaultFetch } from "../util/fetch-function";
import { HaloCoreEndpoints } from "../endpoints/halo-core-endpoints";
import {
  MapAsset,
  MapModePairAsset,
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
import { RequestError } from "../util/request-error";
import { MatchesPrivacy } from "../models/halo-infinite/matches-privacy";
import {
  ProgressionFileType,
  ProgressionFileTypeMap,
} from "../models/halo-infinite/progression-file";
import { unauthorizedRetryPolicy } from "./request-policy";

export interface ResultContainer<TValue> {
  Id: string;
  ResultCode: 0 | 1;
  Result: TValue;
}

export interface ResultsContainer<TValue> {
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
  [AssetKind.MapModePair]: MapModePairAsset;
};

const assetKindUrlMap = {
  [AssetKind.Map]: "Maps" as const,
  [AssetKind.UgcGameVariant]: "UgcGameVariants" as const,
  [AssetKind.Playlist]: "Playlists" as const,
  [AssetKind.MapModePair]: "MapModePairs" as const,
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

  private async executeRequest<T>(url: string, init: RequestInit) {
    const failureHandler = unauthorizedRetryPolicy.onFailure(
      async ({ handled }) => {
        if (handled) {
          await this.spartanTokenProvider.clearSpartanToken();
        }
      }
    );
    try {
      return await unauthorizedRetryPolicy.execute(async () => {
        const headers = new Headers(init.headers);
        if (!headers.has("User-Agent")) {
          headers.set("User-Agent", GlobalConstants.HALO_PC_USER_AGENT);
        }
        if (!headers.has("Accept")) {
          headers.set("Accept", "application/json");
        }
        headers.set(
          "x-343-authorization-spartan",
          await this.spartanTokenProvider.getSpartanToken()
        );

        const response = await this.fetchFn(url, {
          ...init,
          headers,
        });

        if (response.status >= 200 && response.status < 300) {
          return (await response.json()) as T;
        } else {
          throw new RequestError(url, response);
        }
      });
    } finally {
      failureHandler.dispose();
    }
  }

  private async executeResultsRequest<T>(
    ...args: Parameters<HaloInfiniteClient["executeRequest"]>
  ) {
    let resultsContainer: ResultsContainer<T>;
    try {
      resultsContainer = await this.executeRequest<ResultsContainer<T>>(
        ...args
      );
    } catch (e) {
      if (e instanceof RequestError && e.response.status === 404) {
        const contentLength = e.response.headers.get("Content-Length");
        if (contentLength && parseInt(contentLength) > 0) {
          // 404s if even one of the xuids is invalid
          resultsContainer = (await e.response.json()) as ResultsContainer<T>;
        }
      }

      throw e;
    }
    return resultsContainer.Value;
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
  public getPlaylistCsr = (
    playlistId: string,
    playerIds: string[],
    seasonId?: string,
    init?: Omit<RequestInit, "body" | "method">
  ) => {
    const urlParams = new URLSearchParams({
      players: playerIds.map(wrapPlayerId).join(","),
    });
    if (seasonId) {
      urlParams.set("seasonId", seasonId);
    }
    return this.executeResultsRequest<PlaylistCsrContainer>(
      `https://${HaloCoreEndpoints.SkillOrigin}.${HaloCoreEndpoints.ServiceDomain}/hi/playlist/${playlistId}/csrs?${urlParams}`,
      {
        ...init,
        method: "get",
      }
    );
  };

  /** Get gamertag info for a player.
   * @param gamerTag - Gamertag to lookup.
   */
  public getUser = (
    gamerTag: string,
    init?: Omit<RequestInit, "body" | "method">
  ) =>
    this.executeRequest<UserInfo>(
      `https://${HaloCoreEndpoints.Profile}.${HaloCoreEndpoints.ServiceDomain}/users/gt(${gamerTag})`,

      {
        ...init,
        method: "get",
      }
    );

  /** Get gamertag info for several players.
   * @param xuids - Xuids to lookup.
   */
  public getUsers = (
    xuids: string[],
    init?: Omit<RequestInit, "body" | "method">
  ) => {
    return this.executeRequest<UserInfo[]>(
      `https://${HaloCoreEndpoints.Profile}.${
        HaloCoreEndpoints.ServiceDomain
      }/users?xuids=${xuids.map((x) => unwrapPlayerId(x)).join(",")}`,
      {
        ...init,
        method: "get",
      }
    );
  };

  /** Get service record for a player.
   * @param gamerTag - Gamertag to lookup.
   */
  public getUserServiceRecord = (
    gamerTagOrWrappedXuid: string,
    queryParameters?: { seasonId?: string; playlistAssetId?: string },
    init?: Omit<RequestInit, "body" | "method">
  ) =>
    this.executeRequest<ServiceRecord>(
      `https://${HaloCoreEndpoints.StatsOrigin}.${
        HaloCoreEndpoints.ServiceDomain
      }/hi/players/${gamerTagOrWrappedXuid}/Matchmade/servicerecord?${new URLSearchParams(
        queryParameters
      ).toString()}`,
      {
        ...init,
        method: "get",
      }
    );

  /** Get playlist information
   * @param playlistId - Unique ID for the playlist.
   */
  public getPlaylist = (
    playlistId: string,
    init?: Omit<RequestInit, "body" | "method">
  ) =>
    this.executeRequest<Playlist>(
      `https://${HaloCoreEndpoints.GameCmsOrigin}.${HaloCoreEndpoints.ServiceDomain}/hi/multiplayer/file/playlists/assets/${playlistId}.json`,
      {
        ...init,
        method: "get",
      }
    );

  public getPlayerMatches = (
    playerXuid: string,
    type: MatchType = MatchType.All,
    count: number = 25,
    start: number = 0,
    init?: Omit<RequestInit, "body" | "method">
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
      {
        ...init,
        method: "get",
      }
    );
  };

  public getMatchStats = (
    matchId: string,
    init?: Omit<RequestInit, "body" | "method">
  ) =>
    this.executeRequest<MatchStats>(
      `https://${HaloCoreEndpoints.StatsOrigin}.${HaloCoreEndpoints.ServiceDomain}/hi/matches/${matchId}/stats`,
      {
        ...init,
        method: "get",
      }
    );

  public getMatchSkill = async (
    matchId: string,
    playerIds: string[],
    init?: Omit<RequestInit, "body" | "method">
  ) =>
    await this.executeResultsRequest<MatchSkill>(
      `https://${HaloCoreEndpoints.SkillOrigin}.${
        HaloCoreEndpoints.ServiceDomain
      }/hi/matches/${matchId}/skill?players=${playerIds
        .map(wrapPlayerId)
        .join(",")}`,
      {
        ...init,
        method: "get",
      }
    );

  /** Gets authoring metadata about a specific asset. */
  public getAsset = <TAssetType extends keyof AssetKindTypeMap>(
    assetType: TAssetType,
    assetId: string,
    init?: Omit<RequestInit, "body" | "method">
  ) =>
    this.executeRequest<AssetKindTypeMap[TAssetType]>(
      `https://${HaloCoreEndpoints.DiscoveryOrigin}.${HaloCoreEndpoints.ServiceDomain}/hi/${assetKindUrlMap[assetType]}/${assetId}`,
      {
        ...init,
        method: "get",
      }
    );

  /** Gets metadata related to a concrete version of a specified asset. */
  public getSpecificAssetVersion = <TAssetType extends keyof AssetKindTypeMap>(
    assetType: TAssetType,
    assetId: string,
    versionId: string,
    init?: Omit<RequestInit, "body" | "method">
  ) =>
    this.executeRequest<AssetKindTypeMap[TAssetType]>(
      `https://${HaloCoreEndpoints.DiscoveryOrigin}.${HaloCoreEndpoints.ServiceDomain}/hi/${assetKindUrlMap[assetType]}/${assetId}/versions/${versionId}`,
      {
        ...init,
        method: "get",
      }
    );

  public getCurrentUser = (
    init?: Omit<RequestInit, "body" | "method">
  ): Promise<{ xuid: string; notificationsReadDate: string }> =>
    this.executeRequest(
      `https://${HaloCoreEndpoints.CommsOrigin}.${HaloCoreEndpoints.ServiceDomain}/users/me`,
      {
        ...init,
        method: "get",
      }
    );

  public getMatchesPrivacy = (
    playerXuid: string,
    init?: Omit<RequestInit, "body" | "method">
  ): Promise<MatchesPrivacy> =>
    this.executeRequest(
      `https://${HaloCoreEndpoints.StatsOrigin}.${
        HaloCoreEndpoints.ServiceDomain
      }/hi/players/${wrapPlayerId(playerXuid)}/matches-privacy`,
      {
        ...init,
        method: "get",
      }
    );

  public updateMatchesPrivacy = (
    playerXuid: string,
    matchesPrivacy: MatchesPrivacy,
    init?: Omit<RequestInit, "body" | "method">
  ): Promise<MatchesPrivacy> => {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");
    return this.executeRequest(
      `https://${HaloCoreEndpoints.StatsOrigin}.${
        HaloCoreEndpoints.ServiceDomain
      }/hi/players/${wrapPlayerId(playerXuid)}/matches-privacy`,
      {
        ...init,
        method: "put",
        headers,
        body: JSON.stringify({ matchesPrivacy }),
      }
    );
  };
  public getProgressionFile = <TFileType extends ProgressionFileType>(
    filename: `${TFileType}/${string}.json`,
    init?: Omit<RequestInit, "body" | "method">
  ): Promise<ProgressionFileTypeMap[TFileType]> =>
    this.executeRequest(
      `https://${HaloCoreEndpoints.GameCmsOrigin}.${HaloCoreEndpoints.ServiceDomain}/hi/Progression/file/${filename}`,
      {
        ...init,
        method: "get",
      }
    );
}
