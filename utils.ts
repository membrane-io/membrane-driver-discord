import nacl from "tweetnacl";
import rbjs from "random-bytes-js";
import { state } from "membrane";
type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export async function api(
  method: Method,
  path: string,
  query?: any,
  body?: string
) {
  if (!state.token) {
    throw new Error(
      "You must authenticated to use this API. Visit the program's endpoint"
    );
  }
  if (query) {
    Object.keys(query).forEach((key) =>
      query[key] === undefined ? delete query[key] : {}
    );
  }
  const querystr =
    query && Object.keys(query).length ? `?${new URLSearchParams(query)}` : "";

  // Using curl's user-agent because Discord's API doesn't like Membrane's default
  try {
    const res = await fetch(`https://discord.com/api/${path}${querystr}`, {
      method,
      body,
      headers: {
        Authorization: `Bot ${state.token}`,
        "Content-Type": "application/json",
        "User-Agent": "curl/7.85.0",
      },
    });
    // Throw an error if the response status is not valid
    if (res.status >= 400 && res.status < 600) {
      throw new Error(`The HTTP status of the reponse: ${res.status}`);
    }
    return res;
  } catch (err) {
    throw new Error(err);
  }
}

export async function oauthRequest(
  method: "get" | "post" | "put" | "delete",
  url: string,
  reqBody: string,
  headers: any
) {
  const res = await fetch(url, { body: reqBody.toString(), headers, method });
  const status = res.status;
  const body = await res.text();
  return { status, body };
}

export function verifyHeaders(body, headers) {
  // custom RamdomBytes function for tweetnacl
  nacl.setPRNG(function (x, n) {
    var i,
      v = rbjs(n);
    for (i = 0; i < n; i++) x[i] = v[i];
    for (i = 0; i < v.length; i++) v[i] = 0;
  });
  // verify signature
  const reqHeaders = JSON.parse(headers);
  const signature = reqHeaders["x-signature-ed25519"];
  const timestamp = reqHeaders["x-signature-timestamp"];
  const PUBLIC_KEY = state.publicKey;
  return nacl.sign.detached.verify(
    Buffer.from(timestamp + body),
    Buffer.from(signature, "hex"),
    Buffer.from(PUBLIC_KEY, "hex")
  );
}
