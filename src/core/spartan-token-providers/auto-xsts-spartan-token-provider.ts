import {
  RelyingParty,
  XboxAuthenticationClient,
} from "../../authentication/xbox-authentication-client";
import { TokenPersister } from "../token-persisters";
import { HaloAuthenticationClient } from "../../authentication/halo-authentication-client";
import { SpartanTokenProvider } from ".";

/**
 * A SpartanTokenProvider that fetches both the Xbox and Halo tokens in the same
 * process. This is useful for applications that do not need to contend with
 * CORS restrictions.
 */
export class AutoXstsSpartanTokenProvider implements SpartanTokenProvider {
  public readonly getSpartanToken: () => Promise<string>;

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
      tokenPersister
    );
    const haloAuthClient = new HaloAuthenticationClient(
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

    this.getSpartanToken = () => haloAuthClient.getSpartanToken();
  }
}
