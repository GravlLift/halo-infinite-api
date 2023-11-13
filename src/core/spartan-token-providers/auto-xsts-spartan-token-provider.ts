import {
  RelyingParty,
  XboxAuthenticationClient,
} from "../../authentication/xbox-authentication-client";
import { TokenPersister } from "../token-persisters";
import { HaloAuthenticationClient } from "../../authentication/halo-authentication-client";
import { SpartanTokenProvider } from ".";
import { inMemoryTokenPersister } from "../token-persisters/in-memory-token-persister";

/**
 * A SpartanTokenProvider that fetches both the Xbox and Halo tokens in the same
 * process. This is useful for applications that do not need to contend with
 * CORS restrictions.
 */
export class AutoXstsSpartanTokenProvider implements SpartanTokenProvider {
  public readonly getSpartanToken: () => Promise<string>;

  constructor(
    getOauth2AccessToken: () => Promise<string>,
    tokenPersister?: TokenPersister
  ) {
    let actualTokenPersister: TokenPersister;
    if (tokenPersister) {
      actualTokenPersister = tokenPersister;
    } else {
      actualTokenPersister = inMemoryTokenPersister;
    }
    const xboxAuthClient = new XboxAuthenticationClient(tokenPersister);
    const haloAuthClient = new HaloAuthenticationClient(
      async () => {
        const xstsTicket = await xboxAuthClient.getXstsTicket(
          getOauth2AccessToken
        );
        return xstsTicket.Token;
      },
      async () => await actualTokenPersister.load("halo.authToken"),
      async (token) => {
        await actualTokenPersister.save("halo.authToken", token);
      }
    );

    this.getSpartanToken = () => haloAuthClient.getSpartanToken();
  }
}
