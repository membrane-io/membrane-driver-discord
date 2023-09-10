# Discord Driver for Membrane

This [Membrane](https://membrane.io) driver lets you interact with the Discord API through your Membrane graph.

To setup Discord driver follow steps:

1. Create an [application](https://discord.com/developers/applications)
1. Create a bot and get the [bot token](https://discord.com/developers/applications)
1. Get OAuth2 [client id and client Secret](https://discord.com/developers/applications)
1. Add SERVER MEMBERS INTENT and MESSAGE CONTENT INTENT to your bot in Privileged Gateway Intents.
1. Invoke the `:configure` action with the bot token, client id, and client secret.
1. Visit the program's endpoint URL to add the bot to your server's.
1. Optional: Configure an interactions endpoint to receive interactions (outgoing webhooks).
