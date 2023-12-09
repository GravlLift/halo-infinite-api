import {
  RelyingParty,
  XboxAuthenticationClient,
} from "../../authentication/xbox-authentication-client";
import { TokenPersister } from "../token-persisters";
import { HaloAuthenticationClient } from "../../authentication/halo-authentication-client";
import { SpartanTokenProvider } from "./spartan-token-providers";
import { inMemoryTokenPersister } from "../token-persisters/in-memory-token-persister";
import { XboxTokenProvider } from "./xbox-token-provider";
import { FetchFunction } from "src/util/fetch-function";

/**
 * A SpartanTokenProvider that fetches both the Xbox and Halo tokens in the same
 * process. This is useful for applications that do not need to contend with
 * CORS restrictions.
 */
export class AutoTokenProvider
  implements SpartanTokenProvider, XboxTokenProvider
{
  public readonly getSpartanToken: () => Promise<string>;
  public readonly getXboxLiveV3Token: () => Promise<string>;

  constructor(
    getOauth2AccessToken: () => Promise<string>,
    tokenPersister?: TokenPersister | Promise<TokenPersister>,
    fetchFn?: FetchFunction
  ) {
    let tokenPeristerOrPromise: TokenPersister | Promise<TokenPersister>;
    if (tokenPersister) {
      tokenPeristerOrPromise = tokenPersister;
    } else {
      tokenPeristerOrPromise = inMemoryTokenPersister;
    }
    const xboxAuthClient = new XboxAuthenticationClient(
      tokenPersister,
      fetchFn
    );
    const haloAuthClient = new HaloAuthenticationClient(
      async () => {
        const xstsTicket = await xboxAuthClient.getXstsTicket(
          getOauth2AccessToken,
          RelyingParty.Halo
        );
        return xstsTicket.Token;
      },
      async () => {
        const tokenPersister = await tokenPeristerOrPromise;
        return await tokenPersister.load("halo.authToken");
      },
      async (token) => {
        const tokenPersister = await tokenPeristerOrPromise;
        await tokenPersister.save("halo.authToken", token);
      },
      fetchFn
    );

    this.getSpartanToken = () => haloAuthClient.getSpartanToken();
    this.getXboxLiveV3Token = async () => {
      const xstsTicket = await xboxAuthClient.getXstsTicket(
        getOauth2AccessToken,
        RelyingParty.Xbox
      );
      return xboxAuthClient.getXboxLiveV3Token(xstsTicket);
    };
  }
}
