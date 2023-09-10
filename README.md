# Discord Driver

This [driver](https://membrane.io) lets you interact with the Discord API through your Membrane graph.

To setup Discord driver follow steps:

1. Create an [application](https://discord.com/developers/applications)
1. Create a bot and Get the [bot token](https://discord.com/developers/applications)
1. Get OAuth2 [client id and client Secret](https://discord.com/developers/applications)
1. Add SERVER MEMBERS INTENT and MESSAGE CONTENT INTENT to your bot in Privileged Gateway Intents.
1. Invoke :configure action with the bot token, client id and client secret.
1. Visit the Endpoint URL to add the bot to your server's.

optional: You can optionally configure an interactions endpoint to receive interactions (outgoing webhooks).

# Schema

### Types
```javascript
<Root>
    - Fields
        guilds -> Ref <GuildCollection>
        me -> Ref <User>
        users -> Ref <UserCollection>
    - Actions
        configure -> Void
<GuildCollection>
    - Fields
        one(id) -> Ref <Guild>
        items -> List <Guild>
<Guild>
    - Fields
        id -> String
        name -> String
        icon -> String
        owner -> Boolean
        permissions -> String
        features -> List <String>
        channels -> Ref <ChannelCollection>
        members -> Ref <MemberCollection>
        commands -> Ref <CommandCollection>
    - Actions
        createCommand(name, description, options, type) -> Void
    - Events
        onSlashCommand -> Ref <SlashCommand>
<ChannelCollection>
    - Fields
        one(id) -> Ref <Channel>
        items -> List <Channel>
<CommandCollection>
    - Fields
        one(id) -> Ref <Command>
        items -> List <Command>
<MemberCollection>
    - Fields
        one(id) -> Ref <Member>
        items -> List <Member>
<Channel>
    - Fields
        id -> String
        last_message_id -> String
        rate_limit_per_user -> Int
        name -> String
        type -> String
        position -> Int
        flags -> Int
        nsfw -> Boolean
        parent_id -> String
        topic -> String
        guild_id -> String
        permission_overwrites -> List <String>
        messages -> Ref <MessageCollection>
    - Actions
        send(message) -> Void
<MessageCollection>
    - Fields
        one(id) -> Ref <Message>
        items -> List <Message>
<Message>
    - Fields
        id -> String
        type -> String
        content -> String
        channel_id -> String
        pinned -> Boolean
        author -> Ref <User>
        mention_everyone -> Boolean
        tts -> Boolean
        timestamp -> String
        edited_timestamp -> String
        flags -> Int
        author -> Ref <User>
        attachments -> List <String>
        embeds -> List <String>
        mentions -> List <String>
        mention_roles -> List <String>
        reactions -> List <Reaction>
<Command>
    - Fields
        name -> String
        description -> String
        type -> String
        options -> List <String>
        default_permission -> Boolean
        default_member_permissions -> Int
        nsfw -> Boolean
<Member>
    - Fields
        id -> String
        user -> Ref <User>
        nick -> String
        roles -> List <String>
        joined_at -> String
        premium_since -> String
        deaf -> Boolean
        mute -> Boolean
        pending -> Boolean
        flags -> Int
        avatar -> String
<Reaction>
    - Fields
        count -> Int
        me -> Boolean
        emoji -> Ref <Emoji>
<Emoji>
    - Fields
        id -> String
        name -> String
        animated -> Boolean
        available -> Boolean
        require_colons -> Boolean
        managed -> Boolean
        roles -> List <String>
<SlashCommand>
    - Fields
       user -> Ref <User>
       aplication_id -> String
       token -> String
       options -> List <CommandOption>
<CommandOption>
    - Fields
        name -> String
        type -> String
        value -> String
<User>
    - Fields
        id -> String
        username -> String
        discriminator -> String
        avatar -> String
        avatar_decoration -> String
        display_name -> String
        bot -> Boolean
        public_flags -> Int
```
