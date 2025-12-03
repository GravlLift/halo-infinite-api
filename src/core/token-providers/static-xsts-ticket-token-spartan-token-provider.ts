import { HaloAuthenticationClient } from "../../authentication/halo-authentication-client";
import { TokenPersister } from "../token-persisters";
import { inMemoryTokenPersister } from "../token-persisters/in-memory-token-persister";
import { SpartanTokenProvider } from "./spartan-token-provider";

/**
 * A SpartanTokenProvider that fetches uses a pre-fetched XSTS ticket token.
 * Since requests to the Halo API are subject to CORS restrictions a
 * HaloAuthenticationClient can be instantitated with a pre-fetched XSTS ticket
 * and run on a server (such as one provided by the user).
 */
export class StaticXstsTicketTokenSpartanTokenProvider
  extends HaloAuthenticationClient
  implements SpartanTokenProvider
{
  constructor(
    xstsTicketToken: string,
    tokenPersister?: TokenPersister | Promise<TokenPersister>
  ) {
    super(
      {
        fetchToken: () => xstsTicketToken,
        clearXstsToken: async () => {
          console.warn(
            "StaticXstsTicketTokenSpartanTokenProvider does not support clearing xstsTickets"
          );
        },
      },
      {
        loadToken: async () =>
          (await (await actualTokenPersister).load("halo.authToken")) ?? null,
        saveToken: async (token) => {
          await (await actualTokenPersister).save("halo.authToken", token);
        },
        clearToken: async () => {
          await (await actualTokenPersister).clear("halo.authToken");
        },
      }
    );
    let actualTokenPersister: TokenPersister | Promise<TokenPersister>;
    if (tokenPersister) {
      actualTokenPersister = tokenPersister;
    } else {
      actualTokenPersister = inMemoryTokenPersister;
    }
  }
}
