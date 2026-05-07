/**
 * Mastercard Processing APIs Client
 * Integração completa com APIs de Processamento de Pagamentos
 * - Mastercard Processing Credit
 * - Mastercard Processing Debit
 * - Mastercard Processing Authentication
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface ProcessingConfig {
  consumerKey: string;
  sandboxClientId: string;
  keyAlias: string;
  keyPassword: string;
  p12Path: string;
  sandboxMode: boolean;
}

interface CreditTransactionRequest {
  amount: number;
  currency: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  merchantId: string;
  transactionReference: string;
  description: string;
}

interface DebitTransactionRequest {
  amount: number;
  currency: string;
  accountNumber: string;
  routingNumber: string;
  merchantId: string;
  transactionReference: string;
  description: string;
}

interface AuthenticationRequest {
  cardNumber: string;
  amount: number;
  currency: string;
  merchantId: string;
  transactionReference: string;
}

interface TransactionResponse {
  transactionId: string;
  status: 'APPROVED' | 'DECLINED' | 'PENDING' | 'ERROR';
  responseCode: string;
  responseMessage: string;
  authorizationCode?: string;
  riskScore?: number;
  fraudIndicators?: string[];
  timestamp: string;
}

interface AuthenticationResponse {
  authenticationId: string;
  status: 'AUTHENTICATED' | 'FAILED' | 'PENDING';
  challengeRequired: boolean;
  challengeUrl?: string;
  riskScore: number;
  timestamp: string;
}

export class MastercardProcessingClient {
  private config: ProcessingConfig;
  private baseUrl: string;
  private consumerKey: string;
  private keyAlias: string;
  private keyPassword: string;
  private p12Buffer: Buffer;

  constructor(config: Partial<ProcessingConfig> = {}) {
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
   * Carregar arquivo .p12
   */
  private loadP12(): Buffer {
    try {
      if (process.env.MASTERCARD_P12_CERT) {
        return Buffer.from(process.env.MASTERCARD_P12_CERT, 'base64');
      }

      if (this.config.p12Path && fs.existsSync(this.config.p12Path)) {
        return fs.readFileSync(this.config.p12Path);
      }

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
   * Gerar assinatura OAuth 1.0a
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

      const bodyHash = crypto
        .createHash('sha256')
        .update(body || '')
        .digest('base64');

      const oauthParams: Record<string, string> = {
        oauth_consumer_key: this.consumerKey,
        oauth_nonce: nonce,
        oauth_signature_method: 'RSA-SHA256',
        oauth_timestamp: timestamp,
        oauth_version: '1.0',
        oauth_body_hash: bodyHash,
      };

      const sortedParams = Object.keys(oauthParams)
        .sort()
        .map((key) => `${key}=${encodeURIComponent(oauthParams[key])}`)
        .join('&');

      const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;

      const sign = crypto.createSign('RSA-SHA256');
      sign.update(signatureBaseString);

      const signature = sign.sign(
        {
          key: this.p12Buffer,
          format: 'der',
          type: 'pkcs12',
          passphrase: this.keyPassword,
        },
        'base64'
      );

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
   * Processar Transação de Crédito
   */
  async processCredit(request: CreditTransactionRequest): Promise<TransactionResponse> {
    try {
      const url = `${this.baseUrl}/mastercard-processing-core/v1/credit`;

      const body = JSON.stringify({
        amount: request.amount,
        currency: request.currency,
        cardNumber: request.cardNumber,
        expiryMonth: request.expiryMonth,
        expiryYear: request.expiryYear,
        cvv: request.cvv,
        merchantId: request.merchantId,
        transactionReference: request.transactionReference,
        description: request.description,
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
          transactionId: 'ERROR',
          status: 'ERROR',
          responseCode: response.status.toString(),
          responseMessage: `Erro na transação de crédito: ${response.statusText}`,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();

      return {
        transactionId: data.transactionId || 'UNKNOWN',
        status: data.status || 'PENDING',
        responseCode: data.responseCode || '00',
        responseMessage: data.responseMessage || 'Transação processada',
        authorizationCode: data.authorizationCode,
        riskScore: data.riskScore || 50,
        fraudIndicators: data.fraudIndicators || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao processar crédito:', error);
      return {
        transactionId: 'ERROR',
        status: 'ERROR',
        responseCode: '999',
        responseMessage: `Erro: ${String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Processar Transação de Débito
   */
  async processDebit(request: DebitTransactionRequest): Promise<TransactionResponse> {
    try {
      const url = `${this.baseUrl}/mastercard-processing-core/v1/debit`;

      const body = JSON.stringify({
        amount: request.amount,
        currency: request.currency,
        accountNumber: request.accountNumber,
        routingNumber: request.routingNumber,
        merchantId: request.merchantId,
        transactionReference: request.transactionReference,
        description: request.description,
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
          transactionId: 'ERROR',
          status: 'ERROR',
          responseCode: response.status.toString(),
          responseMessage: `Erro na transação de débito: ${response.statusText}`,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();

      return {
        transactionId: data.transactionId || 'UNKNOWN',
        status: data.status || 'PENDING',
        responseCode: data.responseCode || '00',
        responseMessage: data.responseMessage || 'Transação processada',
        authorizationCode: data.authorizationCode,
        riskScore: data.riskScore || 50,
        fraudIndicators: data.fraudIndicators || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao processar débito:', error);
      return {
        transactionId: 'ERROR',
        status: 'ERROR',
        responseCode: '999',
        responseMessage: `Erro: ${String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Autenticar Transação (3DS/SCA)
   */
  async authenticate(request: AuthenticationRequest): Promise<AuthenticationResponse> {
    try {
      const url = `${this.baseUrl}/mastercard-processing-authentication/v1/authenticate`;

      const body = JSON.stringify({
        cardNumber: request.cardNumber,
        amount: request.amount,
        currency: request.currency,
        merchantId: request.merchantId,
        transactionReference: request.transactionReference,
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
          authenticationId: 'ERROR',
          status: 'FAILED',
          challengeRequired: false,
          riskScore: 100,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();

      return {
        authenticationId: data.authenticationId || 'UNKNOWN',
        status: data.status || 'PENDING',
        challengeRequired: data.challengeRequired || false,
        challengeUrl: data.challengeUrl,
        riskScore: data.riskScore || 50,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao autenticar:', error);
      return {
        authenticationId: 'ERROR',
        status: 'FAILED',
        challengeRequired: false,
        riskScore: 100,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Verificar Status de Transação
   */
  async checkTransactionStatus(transactionId: string): Promise<TransactionResponse> {
    try {
      const url = `${this.baseUrl}/mastercard-processing-core/v1/transactions/${transactionId}`;
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
          transactionId,
          status: 'ERROR',
          responseCode: response.status.toString(),
          responseMessage: `Erro ao verificar status: ${response.statusText}`,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();

      return {
        transactionId: data.transactionId || transactionId,
        status: data.status || 'UNKNOWN',
        responseCode: data.responseCode || 'UNKNOWN',
        responseMessage: data.responseMessage || 'Status recuperado',
        authorizationCode: data.authorizationCode,
        riskScore: data.riskScore,
        fraudIndicators: data.fraudIndicators,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return {
        transactionId,
        status: 'ERROR',
        responseCode: '999',
        responseMessage: `Erro: ${String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/mastercard-processing-core/v1/health`;
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
export const mastercardProcessingClient = new MastercardProcessingClient();
