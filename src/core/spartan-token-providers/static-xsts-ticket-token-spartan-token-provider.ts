import { TokenPersister } from "../token-persisters";
import { HaloAuthenticationClient } from "../../authentication/halo-authentication-client";
import { SpartanTokenProvider } from ".";

/**
 * A SpartanTokenProvider that fetches uses a pre-fetched XSTS ticket token.
 * Since requests to the Halo API are subject to CORS restrictions a
 * HaloAuthenticationClient can be instantitated with a pre-fetched XSTS ticket
 * and run on a server (such as one provided by the user).
 */

export class StaticXstsTicketTokenSpartanTokenProvider
  implements SpartanTokenProvider
{
  public readonly getSpartanToken: () => Promise<string>;

  constructor(xstsTicketToken: string, tokenPersister?: TokenPersister) {
    const haloAuthClient = new HaloAuthenticationClient(
      () => xstsTicketToken,
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

    this.getSpartanToken = () => haloAuthClient.getSpartanToken();
  }
}
