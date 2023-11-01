# Discord Driver for Membrane

This driver allows you to interact with the Discord API through your Membrane graph.

To set up the Discord driver, follow these steps:

1. Create an [application](https://discord.com/developers/applications) and obtain the PUBLIC KEY.
   - **Optional**: Configure an interactions endpoint to receive interactions (outgoing webhooks). Use `https://<PROGRAM-ENDPOINT-URL>/interactions`.

2. Create a bot and acquire the [BOT TOKEN](https://discord.com/developers/applications).
   - Add SERVER MEMBERS INTENT and MESSAGE CONTENT INTENT to your bot in Privileged Gateway Intents.

3. Obtain OAuth2 [CLIENT ID and CLIENT SECRET](https://discord.com/developers/applications).
   - Configure the redirect URL in your Discord application:
     - In your Discord Developer Portal, navigate to your application's OAuth2 settings.
     - Add a Redirect URL. Use `https://<PROGRAM-ENDPOINT-URL>/callback`.

4. Invoke the `:configure` action with TOKEN, CLIENT ID, CLIENT SECRET, and PUBLIC KEY.

5. Visit the program's endpoint URL to add the bot to your server.


To obtain the program's endpoint URL, simply right-click on the program's name and select the relevant option to copy the URL.

![Image](https://github.com/membrane-io/membrane-driver-discord/assets/9091881/e896144a-444e-4bfb-8bb5-408fd00e3899)