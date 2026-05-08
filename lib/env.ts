import { z } from "zod"

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),

    NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida").optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatória").optional(),
    NEXT_PUBLIC_REQUIRE_AUTH: z.enum(["true", "false"]).default("false"),
    NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: z.string().url().optional(),
    CREDITS_TESTING_MODE: z.enum(["true", "false"]).default("false"),
    ADMIN_METRICS_KEY: z.string().min(1).optional(),

    NEUTRINO_API_KEY: z.string().min(1).optional(),
    NEUTRINO_USER_ID: z.string().min(1).optional(),
    NEUTRINO_IP_INFO_ENABLED: z.coerce.boolean().default(false),
    NEUTRINO_IP_BLOCKLIST_ENABLED: z.coerce.boolean().default(false),
    NEUTRINO_IP_PROBE_ENABLED: z.coerce.boolean().default(false),
    NEUTRINO_UA_LOOKUP_ENABLED: z.coerce.boolean().default(false),
    NEUTRINO_HOST_REPUTATION_ENABLED: z.coerce.boolean().default(false),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

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

const neutrinoEnvSchema = envSchema.superRefine((data, ctx) => {
  if (data.NODE_ENV === "production" && (!data.NEUTRINO_API_KEY || !data.NEUTRINO_USER_ID)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["NEUTRINO_API_KEY"],
      message: "NEUTRINO_API_KEY e NEUTRINO_USER_ID são obrigatórias em produção",
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
  const parsed = neutrinoEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
    throw new Error(`Configuração de variáveis de ambiente inválida: ${details}`)
  }

  return {
    apiKey: parsed.data.NEUTRINO_API_KEY!,
    userId: parsed.data.NEUTRINO_USER_ID!,
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

export function isCreditsTestingModeEnabled() {
  const env = getEnv()
  if (env.NODE_ENV === "production") {
    return false
  }

  return env.CREDITS_TESTING_MODE === "true"
}
