import type { Metadata } from "next"
import AntifraudSession from "@/components/antifraude/AntifraudSession"

export const metadata: Metadata = {
  title: "Análise Antifraude da Sessão — VeriFiBIN 3.0",
  description:
    "Análise automática de risco do visitante: IP, dispositivo, rede (VPN/TOR/Proxy) e reputação em tempo real.",
}

export default function AntifraudePage() {
  return <AntifraudSession />
}
