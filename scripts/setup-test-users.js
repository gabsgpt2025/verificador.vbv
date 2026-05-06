const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log("🔍 Verificando configuração...")
console.log("URL:", supabaseUrl ? "✅ Configurada" : "❌ Não encontrada")
console.log("Service Key:", supabaseServiceKey ? "✅ Configurada" : "❌ Não encontrada")

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Erro: Variáveis de ambiente não configuradas")
  console.log("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const testUsers = [
  {
    email: "teste.usuario@verifibin.com",
    password: "usuario123",
    full_name: "Usuário de Teste",
    role: "user",
    credits: 500,
  },
  {
    email: "admin@verifibin.com",
    password: "admin123",
    full_name: "Administrador Teste",
    role: "admin",
    credits: 1000,
  },
]

async function createTestUsers() {
  console.log("🚀 Iniciando criação de usuários de teste...\n")

  for (const user of testUsers) {
    try {
      console.log(`📝 Processando usuário: ${user.email}`)

      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const foundUser = existingUsers.users.find((u) => u.email === user.email)

      let userId = null

      if (foundUser) {
        console.log(`⚠️  Usuário ${user.email} já existe, usando ID existente...`)
        userId = foundUser.id
      } else {
        // Criar novo usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        })

        if (authError) {
          console.error(`❌ Erro ao criar usuário ${user.email}:`, authError.message)
          continue
        }

        userId = authData.user.id
        console.log(`✅ Usuário criado no Auth: ${userId}`)
      }

      const { error: profileError } = await supabase.from("users").upsert({
        id: userId,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        credits: user.credits,
        is_active: true,
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error(`❌ Erro ao criar perfil:`, profileError.message)
        continue
      }

      const { data: existingLog } = await supabase
        .from("user_credits_log")
        .select("id")
        .eq("user_id", userId)
        .eq("operation_type", "bonus")
        .eq("description", `Créditos iniciais para ${user.role === "admin" ? "administrador" : "usuário"} de teste`)
        .single()

      if (!existingLog) {
        const { error: creditsError } = await supabase.from("user_credits_log").insert({
          user_id: userId,
          credits_before: 0,
          credits_after: user.credits,
          credits_change: user.credits,
          operation_type: "bonus",
          description: `Créditos iniciais para ${user.role === "admin" ? "administrador" : "usuário"} de teste`,
        })

        if (creditsError) {
          console.error(`❌ Erro ao registrar créditos:`, creditsError.message)
        }
      }

      const { data: existingActivity } = await supabase
        .from("user_activity_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("activity_type", "account_created")
        .single()

      if (!existingActivity) {
        const { error: activityError } = await supabase.from("user_activity_logs").insert({
          user_id: userId,
          activity_type: "account_created",
          activity_description: "Conta de teste criada automaticamente",
          ip_address: "127.0.0.1",
          user_agent: "VeriFiBIN Setup Script",
        })

        if (activityError) {
          console.error(`❌ Erro ao registrar atividade:`, activityError.message)
        }
      }

      console.log(`✅ Usuário ${user.email} configurado com sucesso!`)
      console.log(`   - Role: ${user.role}`)
      console.log(`   - Créditos: ${user.credits}`)
      console.log(`   - ID: ${userId}\n`)
    } catch (error) {
      console.error(`❌ Erro fatal ao processar usuário ${user.email}:`, error.message)
    }
  }

  // Verificar usuários criados
  console.log("🔍 Verificando usuários criados...")
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, credits, is_active, created_at")
      .in(
        "email",
        testUsers.map((u) => u.email),
      )
      .order("role", { ascending: false })

    if (error) {
      console.error("❌ Erro ao verificar usuários:", error.message)
    } else if (users && users.length > 0) {
      console.table(users)
    } else {
      console.log("⚠️  Nenhum usuário encontrado")
    }
  } catch (error) {
    console.error("❌ Erro na verificação:", error.message)
  }

  console.log("\n🎉 Configuração de usuários de teste concluída!")
  console.log("\n📋 Credenciais de Teste:")
  console.log("👤 Usuário Normal:")
  console.log("   Email: teste.usuario@verifibin.com")
  console.log("   Senha: usuario123")
  console.log("\n👨‍💼 Administrador:")
  console.log("   Email: admin@verifibin.com")
  console.log("   Senha: admin123")
  console.log("\n🚀 Inicie o servidor: npm run dev")
  console.log("🌐 Acesse: http://localhost:3000")
}

createTestUsers()
  .then(() => {
    console.log("\n✅ Script executado com sucesso!")
    setTimeout(() => process.exit(0), 1000)
  })
  .catch((error) => {
    console.error("❌ Erro fatal:", error.message)
    console.error("Stack:", error.stack)
    setTimeout(() => process.exit(1), 1000)
  })
