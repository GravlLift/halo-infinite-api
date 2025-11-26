import { HaloAuthenticationClient } from "../../authentication/halo-authentication-client";
import {
  RelyingParty,
  XboxAuthenticationClient,
} from "../../authentication/xbox-authentication-client";
import type { FetchFunction } from "../../util/fetch-function";
import { TokenPersister } from "../token-persisters";
import { inMemoryTokenPersister } from "../token-persisters/in-memory-token-persister";
import { SpartanTokenProvider } from "./spartan-token-provider";
import { XboxTokenProvider } from "./xbox-token-provider";

/**
 * A SpartanTokenProvider that fetches both the Xbox and Halo tokens in the same
 * process. This is useful for applications that do not need to contend with
 * CORS restrictions.
 */
export class AutoTokenProvider
  extends HaloAuthenticationClient
  implements SpartanTokenProvider, XboxTokenProvider
{
  public readonly getXboxLiveV3Token: () => Promise<string>;
  public readonly clearXboxLiveV3Token: () => Promise<void>;

  constructor(
    getOauth2AccessToken: () => Promise<string>,
    tokenPersister?: TokenPersister | Promise<TokenPersister>,
    fetchFn?: FetchFunction
  ) {
    super(
      {
        fetchToken: async () => {
          const xstsTicket = await xboxAuthClient.getXstsTicket(
            RelyingParty.Halo
          );
          return xstsTicket.Token;
        },
        clearXstsToken: () => xboxAuthClient.clearXstsTicket(RelyingParty.Halo),
      },
      {
        loadToken: async () =>
          (await (await tokenPeristerOrPromise).load("halo.authToken")) ?? null,
        saveToken: async (token) => {
          await (await tokenPeristerOrPromise).save("halo.authToken", token);
        },
        clearToken: async () => {
          await (await tokenPeristerOrPromise).clear("halo.authToken");
        },
      },
      fetchFn
    );
    let tokenPeristerOrPromise: TokenPersister | Promise<TokenPersister>;
    if (tokenPersister) {
      tokenPeristerOrPromise = tokenPersister;
    } else {
      tokenPeristerOrPromise = inMemoryTokenPersister;
    }
    const xboxAuthClient = new XboxAuthenticationClient(
      getOauth2AccessToken,
      tokenPersister,
      fetchFn
    );

    this.getXboxLiveV3Token = async () => {
      const xstsTicket = await xboxAuthClient.getXstsTicket(RelyingParty.Xbox);
      return xboxAuthClient.getXboxLiveV3Token(xstsTicket);
    };
    this.clearXboxLiveV3Token = () =>
      xboxAuthClient.clearXstsTicket(RelyingParty.Xbox);
  }
}
