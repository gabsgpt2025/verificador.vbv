/**
 * Mastercard API Client
 * Integração com Mastercard Developer APIs usando OAuth 1.0a
 * APIs: BIN Lookup, 3DS Authentication, Identity Insights, Ethoca Alerts
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface MastercardConfig {
  consumerKey: string;
  sandboxClientId: string;
  keyAlias: string;
  keyPassword: string;
  p12Path: string;
  sandboxMode: boolean;
}

interface BINLookupResponse {
  binNumber: string;
  cardBrand: string;
  cardType: string;
  cardCategory: string;
  issuerCountryCode: string;
  issuerCountryName: string;
  issuerName: string;
  isCommercial: boolean;
  isPrepaid: boolean;
  isReloadable: boolean;
}

interface ThreeDSResponse {
  status: 'ACTIVE' | 'INACTIVE' | 'UNKNOWN';
  requiresChallenge: boolean;
  frictionlessLikelihood: number;
}

interface IdentityInsightsResponse {
  riskScore: number;
  anomalies: string[];
  recommendations: string[];
}

export class MastercardClient {
  private config: MastercardConfig;
  private baseUrl: string;
  private consumerKey: string;
  private keyAlias: string;
  private keyPassword: string;
  private p12Buffer: Buffer;

  constructor(config: Partial<MastercardConfig> = {}) {
    this.config = {
      consumerKey: config.consumerKey || process.env.MASTERCARD_CONSUMER_KEY || '',
      sandboxClientId: config.sandboxClientId || process.env.MASTERCARD_SANDBOX_CLIENT_ID || '',
      keyAlias: config.keyAlias || process.env.MASTERCARD_KEY_ALIAS || 'verifibin',
      keyPassword: config.keyPassword || process.env.MASTERCARD_KEY_PASSWORD || '',
      p12Path: config.p12Path || process.env.MASTERCARD_P12_PATH || '',
      sandboxMode: config.sandboxMode ?? (process.env.MASTERCARD_SANDBOX_MODE !== 'false'),
    };

    this.consumerKey = this.config.consumerKey;
    this.keyAlias = this.config.keyAlias;
    this.keyPassword = this.config.keyPassword;
    
    // Usar Sandbox client ID se disponível
    if (this.config.sandboxClientId && this.config.sandboxMode) {
      this.baseUrl = `https://sandbox.api.mastercard.com?client_id=${this.config.sandboxClientId}`;
    } else {
      this.baseUrl = this.config.sandboxMode
        ? 'https://sandbox.api.mastercard.com'
        : 'https://api.mastercard.com';
    }

    // Carregar arquivo .p12
    this.p12Buffer = this.loadP12();
  }

  /**
   * Carregar arquivo .p12 do sistema de arquivos ou environment variable
   */
  private loadP12(): Buffer {
    try {
      // Tentar carregar do environment variable (base64)
      if (process.env.MASTERCARD_P12_CERT) {
        return Buffer.from(process.env.MASTERCARD_P12_CERT, 'base64');
      }

      // Tentar carregar do arquivo local
      if (this.config.p12Path && fs.existsSync(this.config.p12Path)) {
        return fs.readFileSync(this.config.p12Path);
      }

      // Tentar carregar do diretório padrão
      const defaultPath = path.join(__dirname, 'gabriel gpt-sandbox-signing.p12');
      if (fs.existsSync(defaultPath)) {
        return fs.readFileSync(defaultPath);
      }

      throw new Error('Arquivo .p12 não encontrado');
    } catch (error) {
      console.error('Erro ao carregar arquivo .p12:', error);
      throw error;
    }
  }

  /**
   * Gerar assinatura OAuth 1.0a com RSA-SHA256
   */
  private generateOAuthSignature(
    method: string,
    url: string,
    body?: string
  ): {
    authHeader: string;
    headers: Record<string, string>;
  } {
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonce = crypto.randomBytes(16).toString('hex');

      // Calcular body hash (Google Body Hash extension)
      const bodyHash = crypto
        .createHash('sha256')
        .update(body || '')
        .digest('base64');

      // OAuth parameters
      const oauthParams: Record<string, string> = {
        oauth_consumer_key: this.consumerKey,
        oauth_nonce: nonce,
        oauth_signature_method: 'RSA-SHA256',
        oauth_timestamp: timestamp,
        oauth_version: '1.0',
        oauth_body_hash: bodyHash,
      };

      // Signature Base String
      const sortedParams = Object.keys(oauthParams)
        .sort()
        .map((key) => `${key}=${encodeURIComponent(oauthParams[key])}`)
        .join('&');

      const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;

      // Assinar com chave privada RSA
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(signatureBaseString);

      // Extrair chave privada do .p12
      // Nota: Em produção, usar biblioteca como 'pkcs12' ou 'node-forge'
      const signature = sign.sign(
        {
          key: this.p12Buffer,
          format: 'der',
          type: 'pkcs12',
          passphrase: this.keyPassword,
        },
        'base64'
      );

      // Construir Authorization header
      const authParams = Object.keys(oauthParams)
        .sort()
        .map((key) => `${key}="${encodeURIComponent(oauthParams[key])}"`)
        .join(', ');

      const authHeader = `OAuth ${authParams}, oauth_signature="${encodeURIComponent(signature)}"`;

      return {
        authHeader,
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      };
    } catch (error) {
      console.error('Erro ao gerar assinatura OAuth:', error);
      throw error;
    }
  }

  /**
   * BIN Lookup API - Consultar informações de BIN
   */
  async binLookup(bin: string): Promise<BINLookupResponse> {
    try {
      const url = `${this.baseUrl}/bin-lookup/v1/lookup?bin=${bin}`;
      const { authHeader, headers } = this.generateOAuthSignature('GET', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...headers,
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`BIN Lookup failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        binNumber: bin,
        cardBrand: data.cardBrand || 'UNKNOWN',
        cardType: data.cardType || 'UNKNOWN',
        cardCategory: data.cardCategory || 'UNKNOWN',
        issuerCountryCode: data.issuerCountryCode || 'UNKNOWN',
        issuerCountryName: data.issuerCountryName || 'UNKNOWN',
        issuerName: data.issuerName || 'UNKNOWN',
        isCommercial: data.isCommercial || false,
        isPrepaid: data.isPrepaid || false,
        isReloadable: data.isReloadable || false,
      };
    } catch (error) {
      console.error('Erro no BIN Lookup:', error);
      throw error;
    }
  }

  /**
   * 3DS Authentication API - Verificar status 3DS
   */
  async check3DS(bin: string, amount: number, currency: string): Promise<ThreeDSResponse> {
    try {
      const url = `${this.baseUrl}/3d-secure-authentication/v1/authenticate`;

      const body = JSON.stringify({
        cardNumber: bin + '000000000000', // Usar apenas BIN para teste
        amount,
        currency,
        merchantId: 'VERIFIBIN',
      });

      const { authHeader, headers } = this.generateOAuthSignature('POST', url, body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          Authorization: authHeader,
        },
        body,
      });

      if (!response.ok) {
        // Retornar resposta padrão se API não estiver disponível
        return {
          status: 'UNKNOWN',
          requiresChallenge: false,
          frictionlessLikelihood: 0.5,
        };
      }

      const data = await response.json();

      return {
        status: data.status || 'UNKNOWN',
        requiresChallenge: data.requiresChallenge || false,
        frictionlessLikelihood: data.frictionlessLikelihood || 0.5,
      };
    } catch (error) {
      console.error('Erro no 3DS Check:', error);
      // Retornar resposta padrão em caso de erro
      return {
        status: 'UNKNOWN',
        requiresChallenge: false,
        frictionlessLikelihood: 0.5,
      };
    }
  }

  /**
   * Identity Insights API - Análise de risco
   */
  async analyzeIdentity(
    cardNumber: string,
    amount: number,
    merchantCountry: string
  ): Promise<IdentityInsightsResponse> {
    try {
      const url = `${this.baseUrl}/identity-insights/v1/analyze`;

      const body = JSON.stringify({
        cardNumber,
        amount,
        merchantCountry,
        transactionType: 'PURCHASE',
      });

      const { authHeader, headers } = this.generateOAuthSignature('POST', url, body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          Authorization: authHeader,
        },
        body,
      });

      if (!response.ok) {
        return {
          riskScore: 50,
          anomalies: [],
          recommendations: [],
        };
      }

      const data = await response.json();

      return {
        riskScore: data.riskScore || 50,
        anomalies: data.anomalies || [],
        recommendations: data.recommendations || [],
      };
    } catch (error) {
      console.error('Erro no Identity Insights:', error);
      return {
        riskScore: 50,
        anomalies: [],
        recommendations: [],
      };
    }
  }

  /**
   * Ethoca Alerts API - Alertas de chargeback
   */
  async getChargebackAlerts(cardNumber: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/ethoca-alerts/v1/alerts?cardNumber=${cardNumber}`;
      const { authHeader, headers } = this.generateOAuthSignature('GET', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...headers,
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        return {
          alerts: [],
          riskLevel: 'LOW',
        };
      }

      const data = await response.json();

      return {
        alerts: data.alerts || [],
        riskLevel: data.riskLevel || 'LOW',
      };
    } catch (error) {
      console.error('Erro no Ethoca Alerts:', error);
      return {
        alerts: [],
        riskLevel: 'LOW',
      };
    }
  }

  /**
   * Health check - Verificar conectividade com Mastercard
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/bin-lookup/v1/lookup?bin=552475`;
      const { authHeader, headers } = this.generateOAuthSignature('GET', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...headers,
          Authorization: authHeader,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Exportar instância singleton
export const mastercardClient = new MastercardClient();
