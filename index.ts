// `nodes` contain any nodes you add from the graph (dependencies)
// `root` is a reference to this program's root node
// `state` is an object that persists across program updates. Store data here.
import { nodes, root, state } from "membrane";
import ClientOAuth2 from "client-oauth2";
import { api, oauthRequest, verifyHeaders } from "./utils";

export const Root = {
  status() {
    if (!state.token || !state.publicKey) {
      return `Please follow [these instructions](https://github.com/membrane-io/membrane-driver-discord) to setup your bot`;
    }
    return "Ready";
  },
  configure: async ({ clientId, clientSecret, token, publicKey }) => {
    state.token = token;
    state.publicKey = publicKey;
    state.endpointUrl = await nodes.endpoint.$get();

    // Get and save the application id for commands endpoint
    const req = await api("GET", "oauth2/applications/@me");
    const application = await req.json();
    state.applicationId = application.id;

    // set up oauth2 for join to Discord servers
    state.auth = new ClientOAuth2(
      {
        clientId: clientId,
        clientSecret: clientSecret,
        accessTokenUri: "https://discord.com/api/oauth2/token",
        authorizationUri: "https://discord.com/api/oauth2/authorize",
        redirectUri: `${state.endpointUrl}/callback`,
      },
      oauthRequest
    );
  },
  parse({ name, value }, { self }) {
    switch (name) {
      case "guild": {
        const [id] = value.match(/([0-9]{18})/g);
        return [root.guilds.one({ id })];
      }
      case "channel": {
        const url = new URL(value);
        const [, , guildId, channelId] = url.pathname.split("/");
        return [
          root.guilds.one({ id: guildId }).channels.one({ id: channelId }),
        ];
      }
      case "user": {
        const [id] = value.match(/[0-9]+/g);
        return [root.users.one({ id })];
      }
      case "message": {
        const [channelId, messageId] = value.match(/[0-9]+/g);
        return [
          root.guilds.one.channels
            .one({ id: channelId })
            .messages.one({ id: messageId }),
        ];
      }
    }
    return [];
  },
  guilds: () => ({}),
  users: () => ({}),
  me: async () => {
    const res = await api("GET", "users/@me");
    return await res.json();
  },
  followUpWebhook: async ({ application_id, token, message }) => {
    await api(
      "POST",
      `webhooks/${application_id}/${token}`,
      {},
      JSON.stringify(message)
    );
  },
  tests: () => ({}),
};

export const Tests = {
  ping: async () => {
    const res = await root.me.username;
    return typeof res === "string";
  },
  testGetGuilds: async () => {
    const res = await root.guilds.items.$query(`{ id }`);

    return Array.isArray(res);
  },
  testGetUsers: async () => {
    const id = await root.me.id;
    const res = await root.users.one({ id }).$query(`{ id }`);

    return typeof res === "object";
  },
  testGetChannels: async () => {
    const [guild]: any = await root.guilds.items.$query(`{ id }`);

    const res = await root.guilds
      .one({ id: guild.id })
      .channels.items.$query(`{ id }`);

    return Array.isArray(res);
  },
};

export const UserCollection = {
  one: async ({ id }) => {
    const res = await api("GET", `users/${id}`);
    return await res.json();
  },
};

export const CommandCollection = {
  one: async ({ id }, { self }) => {
    const { id: guildId } = self.$argsAt(root.guilds.one);

    // Get the commands
    const res = await api(
      "GET",
      `applications/${state.applicationId}/guilds/${guildId}/commands/${id}`
    );
    return await res.json();
  },

  items: async (_, { self }) => {
    const { id } = self.$argsAt(root.guilds.one);

    // Get the commands
    const res = await api(
      "GET",
      `applications/${state.applicationId}/guilds/${id}/commands`
    );
    return await res.json();
  },
};

export const MemberCollection = {
  one: async ({ id }, { self }) => {
    const { id: guildId } = self.$argsAt(root.guilds.one);
    const res = await api("GET", `guilds/${guildId}/members/${id}`);
    return await res.json();
  },
  page: async (args, { self }) => {
    const { id } = self.$argsAt(root.guilds.one);
    const res = await api("GET", `guilds/${id}/members`, { ...args });

    const items = await res.json();
    // Get the last user id
    const lastId = items[items.length - 1].user.id;
    return { items, next: self.page({ limit: args.limit, after: lastId }) };
  },
};

export const GuildCollection = {
  one: async ({ id }) => {
    const res = await api("GET", `guilds/${id}`);
    return await res.json();
  },

  items: async () => {
    const res = await api("GET", "users/@me/guilds");
    return await res.json();
  },
};

export const ChannelCollection = {
  one: async ({ id }) => {
    const res = await api("GET", `channels/${id}`);
    return await res.json();
  },

  items: async (_, { self }) => {
    const { id } = self.$argsAt(root.guilds.one);
    const res = await api("GET", `guilds/${id}/channels`);
    return await res.json();
  },
};

export const MessageCollection = {
  one: async ({ id }, { self }) => {
    const { id: channelId } = self.$argsAt(root.guilds.one.channels.one);
    const res = await api("GET", `channels/${channelId}/messages/${id}`);
    return await res.json();
  },

  items: async (args, { self }) => {
    const { id: channelId } = self.$argsAt(root.guilds.one.channels.one);
    const res = await api("GET", `channels/${channelId}/messages`, { ...args });
    return await res.json();
  },
};

export const Guild = {
  gref(_, { obj }) {
    return root.guilds.one({ id: obj.id });
  },
  channels: () => ({}),
  commands: () => ({}),
  members: () => ({}),
  createCommand: async (args, { self }) => {
    const { id } = self.$argsAt(root.guilds.one);
    const res = await api(
      "POST",
      `applications/${state.applicationId}/guilds/${id}/commands`,
      null,
      JSON.stringify({
        name: args.name,
        description: args.description,
        options: args.options || [],
        type: args.type || 1,
      })
    );
    return await res.json();
  },
};

export const Command = {
  async gref(_, { self, obj }) {
    const { id } = self.$argsAt(root.guilds.one);
    return root.guilds.one({ id }).commands.one({ id: obj.id });
  },
  delete: async (_, { self, obj }) => {
    const { id: guildId } = self.$argsAt(root.guilds.one);
    const { id } = self.$argsAt(root.guilds.one.commands.one);

    const res = await api(
      "DELETE",
      `applications/${state.applicationId}/guilds/${guildId}/commands/${id}`
    );
  },
};

export const Channel = {
  gref(_, { obj, self }) {
    const { id } = self.$argsAt(root.guilds.one);
    return root.guilds.one({ id }).channels.one({ id: obj.id });
  },
  messages: () => ({}),
  sendMessage: async (args, { self }) => {
    const { id } = self.$argsAt(root.guilds.one.channels.one);
    const msg = {
      content: args.content,
      components: JSON.parse(args.components || "[]"),
      embeds: JSON.parse(args.embeds || "[]"),
    };
    if (args.message_reference) msg["message_reference"] = args.message_reference;
    if (args.allowed_mentions) msg["allowed_mentions"] = args.allowed_mentions;
    const res = await api(
      "POST",
      `channels/${id}/messages`,
      null,
      JSON.stringify(msg)
    );
    return await res.json();
  },
};

export const Message = {
  gref(_, { obj, self }) {
    const { id: guildId } = self.$argsAt(root.guilds.one);
    const { id: channelId } = self.$argsAt(root.guilds.one.channels.one);
    return root.guilds
      .one({ id: guildId })
      .channels.one({ id: channelId })
      .messages.one({ id: obj.id });
  },
  reactionsByEmote: async (args, { self }) => {
    const { id: channelId } = self.$argsAt(root.guilds.one.channels.one);
    const { id: messageId } = self.$argsAt(root.guilds.one.channels.one.messages.one);
    const emoteStr = args.emote_str;
    const res = await api(
      "GET",
      `channels/${channelId}/messages/${messageId}/reactions/${emoteStr}`,
      null);
    return await res.json();
  },
  postReaction: async (args, { self }) => {
    const { id: channelId } = self.$argsAt(root.guilds.one.channels.one);
    const { id: messageId } = self.$argsAt(root.guilds.one.channels.one.messages.one);
    const emoteStr = args.emote_str;
    const res = await api(
      "PUT",
      `channels/${channelId}/messages/${messageId}/reactions/${emoteStr}/@me`,
      null
    );
  }
};

export const User = {
  gref(_, { obj }) {
    return root.users.one({ id: obj.id });
  },
};

export const Member = {
  gref(_, { obj, self }) {
    const { id } = self.$argsAt(root.guilds.one);
    return root.guilds.one({ id }).members.one({ id: obj.user.id });
  },
};

export const Reaction = {
  gref(_, { obj, self}) {
    const { id: guildId } = self.$argsAt(root.guilds.one);
    const { id: channelId } = self.$argsAt(root.guilds.one.channels.one);
    const { id: messageId } = self.$argsAt(root.guilds.one.channels.one.messages.one)
    const emojiUri = encodeURIComponent(obj.emoji.name);
    return root.guilds
      .one({ id: guildId })
      .channels.one({ id: channelId })
      .messages.one({ id: messageId })
      .reactionsByEmote({emote_str: emojiUri});
  }
}

export const Emoji = {
  gref(_, { obj, self }) {
    const { id: guildId } = self.$argsAt(root.guilds.one);
    const { id: channelId } = self.$argsAt(root.guilds.one.channels.one);
    const { id: messageId } = self.$argsAt(root.guilds.one.channels.one.messages.one)
    return root.guilds
      .one({ id: guildId })
      .channels.one({ id: channelId })
      .messages.one({ id: messageId });
  }
}

export async function endpoint({ path, query, headers, method, body }) {
  switch (path) {
    case "/": {
      return '<a href="/auth">Add bot to Discord server</a>';
    }
    case "/auth":
    case "/auth/": {
      if (!state.auth) {
        return "Please invoke `:configure` first";
      }
      const url = state.auth.code.getUri({
        query: { permissions: 8, scope: "bot" },
      });
      return JSON.stringify({ status: 303, headers: { location: url } });
    }
    case "/callback": {
      state.accessToken = await state.auth.code.getToken(`${path}?${query}`);
      if (state.accessToken?.accessToken) {
        return 'Bot has been added to server - <a href="/auth">Add bot to another Discord server</a>';
      }
      return "There was an issue acquiring the access token. Check the logs.";
    }
    case "/interactions": {
      const event = JSON.parse(body);
      // verify request signature
      const isVerified = verifyHeaders(body, headers);
      if (!isVerified) {
        return JSON.stringify({
          status: 401,
          body: "invalid request signature",
        });
      }
      // type 1: Is a ping event from discord to verify the endpoint
      // type 2: It's received when someone uses a slash command
      // TODO: handle different types of Interaction Types
      const PING = 1;
      const COMMAND = 2;
      switch (event.type) {
        case PING: {
          return JSON.stringify({
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ type: 1 }),
          });
        }
        case COMMAND: {
          const { token, member, data, guild_id, application_id } = event;
          await root.guilds.one({ id: guild_id }).onSlashCommand.$emit({
            options: JSON.stringify(data.options) as any,
            user: member.user.username,
            token,
            application_id,
          });
          return JSON.stringify({
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
            // ACK an interaction and edit a response later, the user sees a loading state.
            body: JSON.stringify({
              type: 5,
            }),
          });
        }
      }
    }
    default:
      console.log("Unknown Endpoint:", path);
  }
}
