# Halo Infinite API

This is a simple typescript wrapper around 343's official Halo Infinite API (the same API that powers both the game and [halowaypoint.com](https://www.halowaypoint.com/)). I based it off the work of the now mysteriously deleted C# Grunt API (a defunct fork of which remains [here](https://github.com/seth-skocelas/grunt/)).

The package is currently limited to the endpoints I've needed to use in other projects, however I do take requests (create an [issue](/issues)) and I welcome [PRs to extend the functionality](/pulls).

### Currently Supported Endpoints

- GET https://profile.svc.halowaypoint.com/users/{gamerTag}
- GET https://profile.svc.halowaypoint.com/users?xuids={xuids}
- GET https://skill.svc.halowaypoint.com/hi/playlist/{playlistId}/csrs?players={playerIds}
- GET https://gamecms-hacs.svc.halowaypoint.com/hi/multiplayer/file/playlists/assets/{playlistId}.json
- GET https://halostats.svc.halowaypoint.com/hi/playlist/{playlistId}/csrs?players={playerIds}
- GET https://halostats.svc.halowaypoint.com/hi/players/xuid({playerId})/matches
- GET https://skill.svc.halowaypoint.com/hi/matches/{matchId}/skill
- GET https://halostats.svc.halowaypoint.com/hi/matches/{matchId}/stats
- GET https://discovery-infiniteugc.svc.halowaypoint.com/hi/{assetType}/{assetId}
- GET https://discovery-infiniteugc.svc.halowaypoint.com/hi/{assetType}/{assetId}/versions/{versionId}

### Getting Started

The core requirement to use the endpoints in the library is to have a Spartan token, that is provided by the Halo Infinite service.

> **⚠️ WARNING**
>
> The Spartan token is associated with _your identity_ and _your account_. **Do not share it** with anyone, under any circumstances. The API wrapper does not explicitly store it anywhere (though you can configure it to store it somewhere of your choosing). It's your responsibility to make sure that it's secure and not available to anyone else.

This library does not provide a way to perform the first step of generating a spartan token, which is to get an Oauth2 access token from Microsoft. Microsoft provides a great set of npm packages for this purpose, [@azure/msal-node](https://www.npmjs.com/package/@azure/msal-node), [@azure/msal-browser](https://www.npmjs.com/package/@azure/msal-browser), [@azure/msal-react](https://www.npmjs.com/package/@azure/msal-react), etc. depending on the flavor of your application.

Make sure that you [register an Azure Active Directory application](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app), as that is how you will make use of the @azure/msal packages.

Below is a simple example of how this library might be used in a console application to get a user's profile:

```typescript
import open from "open"; // An npm package that opens a browser window
import * as msal from "@azure/msal-node";
import { HaloInfiniteClient, AutoXstsSpartanTokenProvider } from "halo-infinite-api";

const oauthApplication = new msal.PublicClientApplication({
  auth: {
    clientId: "42081d3d-4465-4c86-89ba-ea546f825335",
    authority: "https://login.live.com", // Override the default authority with the xbox one
    knownAuthorities: ["login.live.com"],
    protocolMode: "OIDC", // Shit, I actually have no idea what this does, but Microsoft says I need it
  },
});

const client = new HaloInfiniteClient(
  // Other choice for token providers is the StaticXstsTicketTokenSpartanTokenProvider,
  // which uses a preset spartan token
  new AutoXstsSpartanTokenProvider(async () => {
    const token = await oauthApplication.acquireTokenInteractive({
      // offline_access gives us a refresh token which we can use to continually
      // get new credentials from Microsoft as the old ones expire.
      scopes: ["Xboxlive.signin", "Xboxlive.offline_access"],
      openBrowser: async (url) => {
        await open(url);
      },
    });
    return token.accessToken;
  })
);

const user = await client.getUser("GravlLift");
```
