# Halo Infinite API

This is a simple typescript wrapper around 343's official Halo Infinite API (the same API that powers both the game and [halowaypoint.com](https://www.halowaypoint.com/)).I based it off the work of the now mysteriously deleted C# Grunt API (a defunct fork of which remains [here](https://github.com/seth-skocelas/grunt/)).

The package is currently limited to the endpoints I've needed to use in other projects, however I do take requests (create an [issue](/issues)) and I welcome [PRs to extend the functionality](/pulls).

### Currently Supported Endpoints

- GET https://profile.svc.halowaypoint.com/users/{gamerTag}
- GET https://skill.svc.halowaypoint.com/hi/playlist/{playlistId}/csrs?players={playerIds}
- GET https://gamecms-hacs.svc.halowaypoint.com/hi/multiplayer/file/playlists/assets/{playlistId}.json
- GET https://halostats.svc.halowaypoint.com/hi/playlist/{playlistId}/csrs?players={playerIds}
- GET https://halostats.svc.halowaypoint.com/hi/players/xuid({playerId})/matches
- GET https://skill.svc.halowaypoint.com/hi/matches/{matchId}/skill

### Getting Started

The core requirement to use the endpoints in the library is to have a Spartan token, that is provided by the Halo Infinite service.

> **⚠️ WARNING**
>
> The Spartan token is associated with _your identity_ and _your account_. **Do not share it** with anyone, under any circumstances. The API wrapper does not explicitly store it anywhere. It's your responsibility to make sure that it's secure and not available to anyone else.

If you want to automatically generate the Spartan token, you can do so with the help of this package without having to worry about doing any of the REST API calls yourself. Before you get started, make sure that you [register an Azure Active Directory application](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app). You will need it in order to log in with your Microsoft account, that will be used to generate the token. Because this is just for you, you can use `https://localhost` as the redirect URI when you create the application, unless you're thinking of productizing whatever you're building.

Once you have the application registered, you can use the following code to automatically generate the token and call endpoints:

```typescript
import { HaloInfiniteClient } from "halo-infinite-api";

const client = new HaloInfiniteClient(
  "<YOUR_CLIENT_ID_FROM_AAD>",
  "<YOUR_REDIRECT_URI_FROM_AAD>",
  async (authorizeUrl: string) => {
    // A function that transforms the authorization URL into an authorization code.
    // The implementation will vary depending on your use case. This example is how
    // a firefox addon would accomplish the task
    const activeAuthUrl = await browser.identity.launchWebAuthFlow({
      url: authorizeUrl,
      interactive: true,
    });

    return new URL(activeAuthUrl).searchParams.get("code")!;
  },
  // This final parameter is optional, but it allows your HaloInfiniteClient
  // to save tokens somewhere so that you don't need to refetch them every time
  // you restart your application.
  // Again, this is an example for a firefox addon using browser storage.
  {
    load: async (tokenName) => {
      const storageResponse = await browser.storage.local.get(tokenName);
      if (!storageResponse[tokenName]) {
        return null;
      } else {
        return storageResponse[tokenName];
      }
    },
    save: async (tokenName, token) => {
      await browser.storage.local.set({ [tokenName]: token });
    },
  }
);

const user = await client.getUser("GravlLift");
```
