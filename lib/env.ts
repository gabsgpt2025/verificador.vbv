import { z } from "zod"

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),

    NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida").optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatória").optional(),
    NEXT_PUBLIC_REQUIRE_AUTH: z.enum(["true", "false"]).default("false"),
    NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: z.string().url().optional(),

    NEUTRINO_API_KEY: z.string().min(1).optional(),
    NEUTRINO_USER_ID: z.string().min(1).optional(),

    MASTERCARD_CONSUMER_KEY: z.string().min(1).optional(),
    MASTERCARD_SANDBOX_CLIENT_ID: z.string().min(1).optional(),
    MASTERCARD_KEY_ALIAS: z.string().min(1).optional(),
    MASTERCARD_KEY_PASSWORD: z.string().min(1).optional(),
    MASTERCARD_P12_PATH: z.string().min(1).optional(),
    MASTERCARD_P12_CERT: z.string().min(1).optional(),
    MASTERCARD_SANDBOX_MODE: z.enum(["true", "false"]).default("true"),
  })
  .superRefine((data, ctx) => {
    const hasNeutrinoKey = Boolean(data.NEUTRINO_API_KEY)
    const hasNeutrinoUser = Boolean(data.NEUTRINO_USER_ID)

    if (hasNeutrinoKey !== hasNeutrinoUser) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEUTRINO_API_KEY"],
        message: "NEUTRINO_API_KEY e NEUTRINO_USER_ID devem ser definidos juntos",
      })
    }
  })

type ParsedEnv = z.infer<typeof envSchema>

let cachedEnv: ParsedEnv | null = null

export function getEnv(): ParsedEnv {
  if (cachedEnv) {
    return cachedEnv
  }

  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
    throw new Error(`Configuração de variáveis de ambiente inválida: ${details}`)
  }

  cachedEnv = parsed.data
  return cachedEnv
}

export function getNeutrinoCredentials() {
  const env = getEnv()
  if (!env.NEUTRINO_API_KEY || !env.NEUTRINO_USER_ID) {
    throw new Error("NEUTRINO_API_KEY e NEUTRINO_USER_ID são obrigatórias para chamadas da Neutrino API")
  }

  return {
    apiKey: env.NEUTRINO_API_KEY,
    userId: env.NEUTRINO_USER_ID,
  }
}

export function getSupabasePublicEnv() {
  const env = getEnv()
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias para inicializar o Supabase")
  }

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}
