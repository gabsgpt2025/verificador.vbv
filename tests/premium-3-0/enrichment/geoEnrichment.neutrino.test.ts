import { describe, it } from "vitest"

// TODO: enrichGeo é síncrono atualmente. Estes testes serão habilitados
// quando a integração direta do Neutrino IP Info/Blocklist for adicionada ao enrichGeo.
// A integração Neutrino atual ocorre via enrichedAnalysisService → sessionRisk/ipProbe.
describe("geoEnrichment with neutrino", () => {
  it.todo("increases score when proxy is true")
  it.todo("adds fallback factor when neutrino is unavailable")
})
