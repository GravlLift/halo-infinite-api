import { DateTime } from "luxon";
import { TokenPersister } from "../core/token-persisters";
import { XboxTicket } from "../models/xbox-ticket";
import { KeyedExpiryTokenCache } from "../util/keyed-expiry-token-cache";
import { ExpiryTokenCache } from "../util/expiry-token-cache";
import { FetchFunction, defaultFetch } from "../util/fetch-function";
import { RequestError } from "../util/request-error";
import { unauthorizedRetryPolicy } from "../core/request-policy";
import { RelyingParty } from "./relying-party";
import { IXboxRequestSigner } from "./xbox-request-signer";

export class XboxSignedAuthenticationClient {
  static readonly userTokenName = "xbox.signedUserToken";
  static readonly xstsTicketName = (relyingParty: RelyingParty) =>
    `xbox.signedXstsTicket.${relyingParty}`;
  static readonly deviceTokenName = "xbox.signedDeviceToken";
  static readonly titleTokenName = "xbox.signedTitleToken";

  private userTokenCache = new ExpiryTokenCache(
    async (accessToken: string) => {
      const url = "https://user.auth.xboxlive.com/user/authenticate";
      const bodyObj = {
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT",
        Properties: {
          AuthMethod: "RPS",
          SiteName: "user.auth.xboxlive.com",
          RpsTicket: `t=${accessToken}`,
        },
      };
      const bodyStr = JSON.stringify(bodyObj);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-xbl-contract-version": "1",
      };

      const signature = await this.requestSigner.signRequest(
        url,
        `t=${accessToken}`,
        bodyStr,
      );
      headers["Signature"] = signature;

      const response = await this.fetchFn(url, {
        method: "POST",
        headers,
        body: bodyStr,
      });

      if (response.status >= 200 && response.status < 300) {
        const result = (await response.json()) as XboxTicket;

        const token = {
          ...result,
          expiresAt: DateTime.fromISO(result.NotAfter),
        };
        await (
          await this.tokenPersisterOrPromise
        )?.save(XboxSignedAuthenticationClient.userTokenName, token);
        return token;
      } else {
        throw new RequestError(url, response);
      }
    },
    async () => {
      const tokenPersister = await this.tokenPersisterOrPromise;
      return (
        (await tokenPersister?.load<XboxTicket & { expiresAt: unknown }>(
          XboxSignedAuthenticationClient.userTokenName,
        )) ?? null
      );
    },
  );

  private readonly deviceTokenCache = (() => {
    const DEFAULT_KEY = "default" as const;
    const inner = new KeyedExpiryTokenCache<
      XboxTicket & { expiresAt: DateTime },
      typeof DEFAULT_KEY,
      []
    >(
      async () => {
        const url = "https://device.auth.xboxlive.com/device/authenticate";
        const bodyObj = {
          RelyingParty: "http://auth.xboxlive.com",
          TokenType: "JWT",
          Properties: {
            AuthMethod: "ProofOfPossession",
            // Minimal identifiers; XboxAuthNet includes ProofKey for PoP
            DeviceType: "Android",
            SerialNumber: "00000000-0000-0000-0000-000000000000",
            ProofKey: this.requestSigner.proofKey,
          },
        } as const;
        const bodyStr = JSON.stringify(bodyObj);

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-xbl-contract-version": "1",
        };

        const signature = await this.requestSigner.signRequest(
          url,
          "",
          bodyStr,
        );
        headers["Signature"] = signature;

        const response = await this.fetchFn(url, {
          method: "POST",
          headers,
          body: bodyStr,
        });

        if (response.status >= 200 && response.status < 300) {
          const result = (await response.json()) as XboxTicket;

          const token = {
            ...result,
            expiresAt: DateTime.fromISO(result.NotAfter),
          } as XboxTicket & { expiresAt: DateTime };
          await (
            await this.tokenPersisterOrPromise
          )?.save(XboxSignedAuthenticationClient.deviceTokenName, token);
          return token;
        } else {
          throw new RequestError(url, response);
        }
      },
      async () =>
        (await (
          await this.tokenPersisterOrPromise
        )?.load<XboxTicket & { expiresAt: unknown }>(
          XboxSignedAuthenticationClient.deviceTokenName,
        )) ?? null,
    );

    return {
      getToken: () => inner.getToken(DEFAULT_KEY),
      getExistingToken: () => inner.getExistingToken(DEFAULT_KEY),
      clearToken: () => inner.clearToken(DEFAULT_KEY),
    };
  })();

  private readonly titleTokenCache = (() => {
    const DEFAULT_KEY = "default" as const;
    const inner = new KeyedExpiryTokenCache<
      XboxTicket & { expiresAt: DateTime },
      typeof DEFAULT_KEY,
      [string, string]
    >(
      async (_key, oauthAccessToken: string, deviceToken: string) => {
        const url = "https://title.auth.xboxlive.com/title/authenticate";
        const rps = `t=${oauthAccessToken}`;
        const bodyObj = {
          RelyingParty: "http://auth.xboxlive.com",
          TokenType: "JWT",
          Properties: {
            AuthMethod: "RPS",
            SiteName: "user.auth.xboxlive.com",
            RpsTicket: rps,
            DeviceToken: deviceToken,
            ProofKey: this.requestSigner.proofKey,
          },
        } as const;
        const bodyStr = JSON.stringify(bodyObj);

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-xbl-contract-version": "1",
        };

        const signature = await this.requestSigner.signRequest(
          url,
          rps,
          bodyStr,
        );
        headers["Signature"] = signature;

        const response = await this.fetchFn(url, {
          method: "POST",
          headers,
          body: bodyStr,
        });

        if (response.status >= 200 && response.status < 300) {
          const result = (await response.json()) as XboxTicket;
          const token = {
            ...result,
            expiresAt: DateTime.fromISO(result.NotAfter),
          } as XboxTicket & { expiresAt: DateTime };
          await (
            await this.tokenPersisterOrPromise
          )?.save(XboxSignedAuthenticationClient.titleTokenName, token);
          return token;
        } else {
          throw new RequestError(url, response);
        }
      },
      async () =>
        (await (
          await this.tokenPersisterOrPromise
        )?.load<XboxTicket & { expiresAt: unknown }>(
          XboxSignedAuthenticationClient.titleTokenName,
        )) ?? null,
    );

    return {
      // Preserve existing call signature: (oauthAccessToken, deviceToken)
      getToken: (oauthAccessToken: string, deviceToken: string) =>
        inner.getToken(DEFAULT_KEY, oauthAccessToken, deviceToken),
      getExistingToken: () => inner.getExistingToken(DEFAULT_KEY),
      clearToken: () => inner.clearToken(DEFAULT_KEY),
    };
  })();

  private xstsTicketCache = new KeyedExpiryTokenCache(
    async (
      relyingParty: RelyingParty,
      tokens: { user: string[]; device: string; title: string },
    ) => {
      const url = "https://xsts.auth.xboxlive.com/xsts/authorize";
      const response = await this.fetchFn(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-xbl-contract-version": "1",
        },
        body: JSON.stringify({
          RelyingParty: relyingParty,
          TokenType: "JWT",
          Properties: {
            SandboxId: "RETAIL",
            UserTokens: tokens.user,
            DeviceToken: tokens.device,
            TitleToken: tokens.title,
          },
        }),
      });

      if (response.status >= 200 && response.status < 300) {
        const result = (await response.json()) as XboxTicket;

        const token = {
          ...result,
          expiresAt: DateTime.fromISO(result.NotAfter),
        };
        await (
          await this.tokenPersisterOrPromise
        )?.save(
          XboxSignedAuthenticationClient.xstsTicketName(relyingParty),
          token,
        );
        return token;
      } else {
        throw new RequestError(url, response);
      }
    },
    async (relyingParty) =>
      (await (
        await this.tokenPersisterOrPromise
      )?.load<XboxTicket & { expiresAt: unknown }>(
        XboxSignedAuthenticationClient.xstsTicketName(relyingParty),
      )) ?? null,
  );

  constructor(
    private readonly getOauth2AccessToken: () => Promise<string>,
    private readonly requestSigner: IXboxRequestSigner,
    private readonly tokenPersisterOrPromise?:
      | TokenPersister
      | Promise<TokenPersister>,
    private readonly fetchFn: FetchFunction = defaultFetch,
  ) {}

  public async getXstsTicket(relyingParty: RelyingParty) {
    let xstsTicket = await this.xstsTicketCache.getExistingToken(relyingParty);
    if (!xstsTicket) {
      let [existingUserToken, existingTitleToken] = await Promise.all([
        this.userTokenCache.getExistingToken(),
        this.titleTokenCache.getExistingToken(),
      ]);
      const xstsTicketFailureHandler = unauthorizedRetryPolicy.onFailure(
        async ({ handled }) => {
          if (handled) {
            // Clear from memory
            this.userTokenCache.clearToken();
            // Clear from storage
            const tokenPersister = await this.tokenPersisterOrPromise;
            await Promise.all([
              tokenPersister
                ?.clear(XboxSignedAuthenticationClient.userTokenName)
                ?.then(() => {
                  existingUserToken = null;
                }),
            ]);
          }
        },
      );
      xstsTicket = await unauthorizedRetryPolicy
        .execute(async () => {
          let _oauthTokenPromise: Promise<string> | undefined = undefined;
          const getOauthToken = async () => {
            if (!_oauthTokenPromise) {
              // Ouath2 token depends on nothing, so we can fetch it without
              // worrying if it is expired.
              _oauthTokenPromise = this.getOauth2AccessToken();
            }
            return _oauthTokenPromise;
          };

          const deviceTokenPromise = this.deviceTokenCache
            .getToken()
            .then((dt) => dt.Token);

          const [userTokens, deviceToken, titleToken] = await Promise.all([
            (async () => {
              if (!existingUserToken) {
                const oauthToken = await getOauthToken();
                existingUserToken =
                  await this.userTokenCache.getToken(oauthToken);
              }
              return [existingUserToken.Token];
            })(),
            deviceTokenPromise,
            deviceTokenPromise.then(async (dt) => {
              if (!existingTitleToken) {
                const oauthToken = await getOauthToken();
                existingTitleToken = await this.titleTokenCache.getToken(
                  oauthToken,
                  dt,
                );
              }
              return existingTitleToken.Token;
            }),
          ]);
          return this.xstsTicketCache.getToken(relyingParty, {
            user: userTokens,
            device: deviceToken,
            title: titleToken,
          });
        })
        .finally(() => xstsTicketFailureHandler.dispose());
    }
    return xstsTicket;
  }

  public clearXstsTicket = async (relyingParty: RelyingParty) => {
    // Clear from memory
    this.xstsTicketCache.clearToken(relyingParty);
    // Clear from storage
    (await this.tokenPersisterOrPromise)?.clear(
      XboxSignedAuthenticationClient.xstsTicketName(relyingParty),
    );
  };

  public getXboxLiveV3Token = (xboxTicket: XboxTicket) =>
    `XBL3.0 x=${xboxTicket.DisplayClaims.xui[0].uhs};${xboxTicket.Token}`;

  public clearXboxUserToken = async () => {
    // Clear from memory
    this.userTokenCache.clearToken();
    // Clear from storage
    (await this.tokenPersisterOrPromise)?.clear(
      XboxSignedAuthenticationClient.userTokenName,
    );
  };
}
