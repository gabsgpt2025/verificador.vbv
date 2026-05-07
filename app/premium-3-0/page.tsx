import Premium3DAnalyzer from '@/components/premium-3-0/Premium3DAnalyzer';

export const metadata = {
  title: 'VeriFiBIN Premium 3.0 - Verificação Anti-Fraude',
  description: 'Motor de verificação de segurança anti-fraude com análise de BIN, 3DS e detecção de frictionless',
};

export default function Premium3Page() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-12">
      <Premium3DAnalyzer />
    </main>
  );
}
