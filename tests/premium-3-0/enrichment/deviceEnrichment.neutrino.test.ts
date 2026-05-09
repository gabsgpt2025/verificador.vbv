import { describe, it } from "vitest"

// TODO: enrichDevice é síncrono atualmente. Estes testes serão habilitados
// quando a integração direta do Neutrino UA Lookup for adicionada ao enrichDevice.
// A integração Neutrino atual ocorre via enrichedAnalysisService → sessionRisk.
describe("deviceEnrichment with neutrino", () => {
  it.todo("uses neutrino bot classification")
  it.todo("falls back to local parser when neutrino fails")
})
