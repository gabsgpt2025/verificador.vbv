import { afterEach, describe, expect, it, vi } from "vitest"

const { randomBytesMock, signUpdateMock, signMock, createSignMock } = vi.hoisted(() => ({
  randomBytesMock: vi.fn(() => Buffer.from("00112233445566778899aabbccddeeff", "hex")),
  signUpdateMock: vi.fn(),
  signMock: vi.fn(() => "test-signature-base64=="),
  createSignMock: vi.fn(() => ({
    update(input: string) {
      signUpdateMock(input)
      return this
    },
    sign: signMock,
  })),
}))

vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>()

  return {
    ...actual,
    randomBytes: randomBytesMock,
    createSign: createSignMock,
  }
})

import { loadPrivateKeyFromEnv, signRequest } from "@/lib/integrations/mastercard/oauthSigner"

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDIl99I6Kc6IQ60
B8DqE+FIlwui5wT+BJsiR1WE5vDW6+ZRZXMQn9Q8lzeQh3LiNAnQ+M2L88LGuXau
vk5TxvQK/OIvXTAzoxjiuoW4RQ0VgXgQ0A7jzGdKNSSST2LhIaRMlw/7xgZsXASq
/lx2IPD0YYraC1eP9O8Tpe4+4/GLR8qPiDOQoygfYKR3qfufSu/BgSv0lX8kfn3j
P1QORv66icbFF0RNg9YJ+PCZg7q5PjVGGV9R8hljM8peZgJy9n3QxA7lgXu4KzA0
3rqAOWfYguay5Ar0JJm66a4nkS0KMWM8JdD5M/2P4l4z7Z7T9iYGTvEj6n3YcrQY
yjIWhMlRAgMBAAECggEAB+gKnt2BJvtxu5lS7m8amTtp6qEqZe9JX2Nqg9x1+SE1
QO4A8xcY0NqW0YafrkgyCptWad+TA8Ovm0Xiy4zaDK2iOaf+3tDcXDVbC0Sm0WCE
zVZGQ69xeFgHyYKz0Ls4vFqLeCsAD9AEPibAA4k8Q0jUBwoypFGNi4s0gP9FYPO5
XpM8xtSca49M8d9WXgu7YQQAIkN+Bjlwm6WgXKjE3N5J0Pe6+TXVvHNoV22oKJuw
4loB87P8irjRjFqE4XvW7MK3x8yD1v5u2w4H8m4mF+DOQcJ93SHb69s1Lg1c/h2B
gJ8bkZsW3ppZz+m7oY+WWN4KODxEm8pqGBUojPP8aQKBgQD22b7Qg7eN1Qu3H83M
VQ8f5tD19tGXwAXVKt8B4QStvOSr6VYFdTPNYr7Di9GHOU7eEV0pKkHSP4RFg8dA
DlR7KF/cpaNY/gQ+P2+DFbmSg6+VSpkGHdJtsnJXd1r0oe6kjKImxVJj4/KZQnSr
mNmvDls2Yhc7GOwJybw0Wg1/KwKBgQDRk6H2emW/Q6n0Q70/oYue1fCg1PqJGA4t
y4zdqOFxQ+KUjH2E85jCEVdGWqLdyPBY0t7wBQ/owPI66p7H43Ax2s0jf2jNAqa5
cl4VX8DfoNcqYt40wRPXMtLhKe5z8Rj5/LdZIF2T3T1t8g4HqVVov4x1mKicQy+j
4MwDh7sTPQKBgGoRug7uLJHrmP1uXglbC3UPD5lB7sv5YvT7k7Jp8bbSq9okB4jD
b4l9vL7Tu6p2MLxhjVslCW0LfAZVYcg86r6K5B8tBu6iWWvBqR3q0cBp+v2Gcx9z
tjx3M0dzAoQ0z6DJ1wiHnIgdqZ14+cJTtMlCVs4s3rf0T7s6B7Q1kVjXAoGBALjQ
31p3f9H0jp68TpxrW9f95JXy0o9kv7FiVgdzmDteUNkRhNN2f97MvYd45dnq9Jq5
ut9x6PMr7+t/lKX/9PXAZF12x0uY8mKnFJE3tK5t5ab3T2SJnB/gDCXXnA80x3dG
h6cEwSOOUsv4T0WLdSbo1CYGltxSCmxn+9F4noLdAoGAVmZX7HTo3pyzmLeE2s6Y
ZjEEoxdLSEDRazWx4mGc8nmKO0mmwGsSw8az1x9m0v0hTYsLo8n3jC9BqRz7v1l7
ab7Jsc5c4fJJj6u6pQJB+bqzhyLW6f6fUM4X8apV3vk+nr9UCrXw56myy6dDFTgn
hNf7AqCSHHrTi6S+rYKnPQs=
-----END PRIVATE KEY-----`

describe("oauthSigner", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.MASTERCARD_PRIVATE_KEY
  })

  it("gera um header OAuth RSA-SHA256 determinístico para GET", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_717_171_717_000)

    const { authorizationHeader } = signRequest({
      consumerKey: "consumer-key-123",
      privateKeyPem: PRIVATE_KEY,
      method: "GET",
      url: "https://sandbox.api.mastercard.com/bin-resources/bins/553133?locale=pt_BR",
      queryParams: {
        region: "LATAM",
      },
    })

    expect(signUpdateMock).toHaveBeenCalledWith(
      "GET&https%3A%2F%2Fsandbox.api.mastercard.com%2Fbin-resources%2Fbins%2F553133&locale%3Dpt_BR%26oauth_consumer_key%3Dconsumer-key-123%26oauth_nonce%3D00112233445566778899aabbccddeeff%26oauth_signature_method%3DRSA-SHA256%26oauth_timestamp%3D1717171717%26oauth_version%3D1.0%26region%3DLATAM",
    )
    expect(authorizationHeader).toBe(
      'OAuth oauth_consumer_key="consumer-key-123", oauth_nonce="00112233445566778899aabbccddeeff", oauth_signature="test-signature-base64%3D%3D", oauth_signature_method="RSA-SHA256", oauth_timestamp="1717171717", oauth_version="1.0"',
    )
  })

  it("carrega a private key de base64 e converte \\n literais", () => {
    process.env.MASTERCARD_PRIVATE_KEY = Buffer.from(PRIVATE_KEY.replace(/\n/g, "\\n"), "utf8").toString("base64")

    expect(loadPrivateKeyFromEnv()).toBe(PRIVATE_KEY)
  })
})
