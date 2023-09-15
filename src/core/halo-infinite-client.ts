import axios, { AxiosHeaders, Method } from "axios";
import { HaloAuthenticationClient } from "../authentication/halo-authentication-client";
import {
  RelyingParty,
  XboxAuthenticationClient,
} from "../authentication/xbox-authentication-client";
import { HaloCoreEndpoints } from "../endpoints/halo-core-endpoints";
import { MatchSkill } from "../models/halo-infinite/match-skill";
import { MatchStats } from "../models/halo-infinite/match-stats";
import { MatchType } from "../models/halo-infinite/match-type";
import { PlayerMatchHistory } from "../models/halo-infinite/player-match-history";
import { Playlist } from "../models/halo-infinite/playlist";
import { PlaylistCsrContainer } from "../models/halo-infinite/playlist-csr-container";
import { ServiceRecord } from "../models/halo-infinite/service-record";
import { UserInfo } from "../models/halo-infinite/user-info";
import { GlobalConstants } from "../util/global-contants";
import { MapAsset, UgcGameVariantAsset } from "../models/halo-infinite/asset";
import { AssetKind } from "../models/halo-infinite/asset-kind";

interface ResultContainer<TValue> {
  Id: string;
  ResultCode: number;
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

interface TokenPersister {
  load: <T>(tokenName: string) => Promise<T>;
  save: (tokenName: string, token: unknown) => Promise<void>;
}

type AssetKindTypeMap = {
  [AssetKind.Map]: MapAsset;
  [AssetKind.UgcGameVariant]: UgcGameVariantAsset;
};

const assetKindUrlMap = {
  [AssetKind.Map]: "Maps",
  [AssetKind.UgcGameVariant]: "UgcGameVariants",
} satisfies {
  [key in keyof AssetKindTypeMap]: string;
};

function wrapPlayerId(playerId: string) {
  if (/^\w+(\d+)/) {
    return playerId;
  } else {
    // Assume xuid
    return `xuid(${playerId})`;
  }
}

export class HaloInfiniteClient {
  private readonly haloAuthClient: HaloAuthenticationClient;

  constructor(
    clientId: string,
    redirectUri: string,
    getAuthCode: (authorizeUrl: string) => Promise<string>,
    tokenPersister?: TokenPersister
  ) {
    const xboxAuthClient = new XboxAuthenticationClient(
      clientId,
      redirectUri,
      getAuthCode,
      async () => {
        if (tokenPersister) {
          return await tokenPersister.load("xbox.authToken");
        } else {
          return null;
        }
      },
      async (token) => {
        if (tokenPersister) {
          await tokenPersister.save("xbox.authToken", token);
        }
      }
    );
    this.haloAuthClient = new HaloAuthenticationClient(
      async () => {
        const accessToken = await xboxAuthClient.getAccessToken();
        const userToken = await xboxAuthClient.getUserToken(accessToken);
        const xstsTicket = await xboxAuthClient.getXstsTicket(
          userToken,
          RelyingParty.Halo
        );
        return xstsTicket.Token;
      },
      async () => {
        if (tokenPersister) {
          return await tokenPersister.load("halo.authToken");
        } else {
          return null;
        }
      },
      async (token) => {
        if (tokenPersister) {
          await tokenPersister.save("halo.authToken", token);
        }
      }
    );
  }

  private async executeRequest<T>(
    url: string,
    method: Method,
    useSpartanToken = true,
    useClearance = false,
    userAgent: string = GlobalConstants.HALO_WAYPOINT_USER_AGENT,
    throwOn404: boolean = true
  ) {
    const headers = new AxiosHeaders({
      "User-Agent": userAgent,
      Accept: "application/json",
    });

    if (useSpartanToken) {
      headers.set(
        "x-343-authorization-spartan",
        await this.haloAuthClient.getSpartanToken()
      );
    }

    if (useClearance) {
      throw new Error("TODO: Implement clearance");
    }

    const response = await axios.request<T>({
      url,
      method,
      headers,
      validateStatus: (status) =>
        status < 400 || (status === 404 && !throwOn404),
    });

    return response.data;
  }

  private async executeResultsRequest<T>(
    url: string,
    method: Method,
    useSpartanToken = true,
    useClearance = false,
    userAgent: string = GlobalConstants.HALO_WAYPOINT_USER_AGENT
  ) {
    const result = await this.executeRequest<ResultsContainer<T>>(
      url,
      method,
      useSpartanToken,
      useClearance,
      userAgent,
      false
    );

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
      }/hi/players/xuid(${wrapPlayerId(playerXuid)})/matches`,
      "get"
    );
  };

  public getMatchStats = (matchId: string) =>
    this.executeRequest<MatchStats>(
      `https://${HaloCoreEndpoints.StatsOrigin}.${HaloCoreEndpoints.ServiceDomain}/hi/matches/${matchId}/stats`,
      "get"
    );

  public getMatchSkill = (matchId: string, playerIds: string[]) =>
    this.executeResultsRequest<MatchSkill>(
      `https://${HaloCoreEndpoints.SkillOrigin}.${
        HaloCoreEndpoints.ServiceDomain
      }/hi/matches/${matchId}/skill?players=${playerIds
        .map(wrapPlayerId)
        .join(",")}`,
      "get"
    );

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
