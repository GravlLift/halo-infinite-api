import { TokenPersister } from "../token-persisters";
import { HaloAuthenticationClient } from "../../authentication/halo-authentication-client";
import { SpartanTokenProvider } from ".";
import { inMemoryTokenPersister } from "../token-persisters/in-memory-token-persister";

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
    let actualTokenPersister: TokenPersister;
    if (tokenPersister) {
      actualTokenPersister = tokenPersister;
    } else {
      actualTokenPersister = inMemoryTokenPersister;
    }

    const haloAuthClient = new HaloAuthenticationClient(
      () => xstsTicketToken,
      async () => await actualTokenPersister.load("halo.authToken"),
      async (token) => {
        await actualTokenPersister.save("halo.authToken", token);
      }
    );

    this.getSpartanToken = () => haloAuthClient.getSpartanToken();
  }
}
