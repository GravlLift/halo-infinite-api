import { TokenPersister } from "../../token-persisters";
import { HaloAuthenticationClient } from "../../../authentication/halo-authentication-client";
import { SpartanTokenProvider } from ".";
import { inMemoryTokenPersister } from "../../token-persisters/in-memory-token-persister";

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
  public readonly clearSpartanToken: () => Promise<void>;

  constructor(
    xstsTicketToken: string,
    tokenPersister?: TokenPersister | Promise<TokenPersister>
  ) {
    let actualTokenPersister: TokenPersister | Promise<TokenPersister>;
    if (tokenPersister) {
      actualTokenPersister = tokenPersister;
    } else {
      actualTokenPersister = inMemoryTokenPersister;
    }

    const haloAuthClient = new HaloAuthenticationClient(
      () => xstsTicketToken,
      async () =>
        (await (await actualTokenPersister).load("halo.authToken")) ?? null,
      async (token) => {
        await (await actualTokenPersister).save("halo.authToken", token);
      },
      async () => {
        await (await actualTokenPersister).clear("halo.authToken");
      }
    );

    this.getSpartanToken = () => haloAuthClient.getSpartanToken();
    this.clearSpartanToken = () => haloAuthClient.clearSpartanToken();
  }
}
