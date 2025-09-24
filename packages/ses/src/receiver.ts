import {
  SESClient,
  SESClientConfig,
} from '@aws-sdk/client-ses';
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  type GetObjectCommandInput,
  type DeleteObjectCommandInput,
} from '@aws-sdk/client-s3';
import {
  SESEvent,
  SESEventRecord,
  SESMail,
  SESReceipt,
} from 'aws-lambda';

import { parseEmailHeaders } from './helpers';
import { SESReceiverConfig, ParsedSESEvent, ParsedAttachment } from './interfaces';

const DEFAULT_REGION = 'us-east-1';

/**
 * wrapper para recibir y parsear eventos ses
 */
export class SESReceiver {
  private sesClient: SESClient;
  private s3Client?: S3Client;
  private config: SESReceiverConfig;

  constructor(config: SESReceiverConfig = {}) {
    const clientConfig: SESClientConfig = {
      region: config.region ?? process.env.AWS_REGION ?? DEFAULT_REGION,
    };

    if (config.credentials?.accessKeyId && config.credentials?.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.credentials.accessKeyId,
        secretAccessKey: config.credentials.secretAccessKey,
      };
    }

    this.config = config;
    this.sesClient = new SESClient(clientConfig);

    // inicializar cliente s3 si se proporciona bucket
    if (config.bucketName) {
      this.s3Client = new S3Client(clientConfig);
    }
  }

  /**
   * parsea un evento ses de lambda
   */
  async parseEvent(event: SESEvent): Promise<ParsedSESEvent[]> {
    const parsedEmails: ParsedSESEvent[] = [];

    for (const record of event.Records) {
      const parsed = await this.parseRecord(record);
      parsedEmails.push(parsed);
    }

    return parsedEmails;
  }

  /**
   * parsea un record individual de ses
   */
  async parseRecord(record: SESEventRecord): Promise<ParsedSESEvent> {
    const mail = record.ses.mail;
    const receipt = record.ses.receipt;

    const parsed: ParsedSESEvent = {
      messageId: mail.messageId,
      source: mail.source,
      timestamp: mail.timestamp,
      from: mail.source,
      to: mail.destination,
      headers: this.parseMailHeaders(mail),
      raw: record,
    };

    // extraer subject del header
    if (parsed.headers.subject) {
      parsed.subject = parsed.headers.subject;
    }

    // información de spam/virus si está disponible
    if (receipt.spamVerdict) {
      parsed.spam = {
        verdict: receipt.spamVerdict.status,
        score: parseFloat(parsed.headers['x-ses-spam-verdict'] || '0'),
      };
    }

    if (receipt.virusVerdict) {
      parsed.virus = {
        verdict: receipt.virusVerdict.status,
      };
    }

    if (receipt.dkimVerdict) {
      parsed.dkim = {
        verdict: receipt.dkimVerdict.status,
      };
    }

    if (receipt.spfVerdict) {
      parsed.spf = {
        verdict: receipt.spfVerdict.status,
      };
    }

    // si hay acción s3, intentar obtener el contenido
    if (receipt.action?.type === 'S3' && this.s3Client) {
      const s3Action = receipt.action as any;
      if (s3Action.bucketName && s3Action.objectKey) {
        try {
          parsed.content = await this.getEmailContentFromS3(
            s3Action.bucketName,
            s3Action.objectKey
          );

          // parsear attachments si está habilitado
          if (this.config.autoDownloadAttachments && parsed.content) {
            parsed.attachments = await this.parseAttachments(parsed.content);
          }
        } catch (error) {
          console.error('Error retrieving email from S3:', error);
        }
      }
    }

    return parsed;
  }

  /**
   * parsea headers del email
   */
  private parseMailHeaders(mail: SESMail): Record<string, string> {
    const headers: Record<string, string> = {};

    if (mail.headers && Array.isArray(mail.headers)) {
      mail.headers.forEach((header: any) => {
        if (header.name && header.value) {
          headers[header.name.toLowerCase()] = header.value;
        }
      });
    }

    // también incluir commonHeaders si están disponibles
    if (mail.commonHeaders) {
      const common = mail.commonHeaders as any;
      if (common.subject) headers.subject = common.subject;
      if (common.from) headers.from = Array.isArray(common.from) ? common.from[0] : common.from;
      if (common.to) headers.to = Array.isArray(common.to) ? common.to.join(', ') : common.to;
      if (common.date) headers.date = common.date;
      if (common.messageId) headers['message-id'] = common.messageId;
    }

    return headers;
  }

  /**
   * obtiene contenido del email desde s3
   */
  private async getEmailContentFromS3(
    bucketName: string,
    objectKey: string
  ): Promise<string | undefined> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const params: GetObjectCommandInput = {
      Bucket: bucketName,
      Key: objectKey,
    };

    try {
      const response = await this.s3Client.send(new GetObjectCommand(params));

      if (response.Body) {
        return await response.Body.transformToString();
      }
    } catch (error) {
      console.error('Error fetching email from S3:', error);
      throw error;
    }

    return undefined;
  }

  /**
   * elimina email de s3 después de procesarlo
   */
  async deleteEmailFromS3(bucketName: string, objectKey: string): Promise<boolean> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const params: DeleteObjectCommandInput = {
      Bucket: bucketName,
      Key: objectKey,
    };

    try {
      await this.s3Client.send(new DeleteObjectCommand(params));
      return true;
    } catch (error) {
      console.error('Error deleting email from S3:', error);
      return false;
    }
  }

  /**
   * parsea attachments del contenido del email (simplificado)
   */
  private async parseAttachments(emailContent: string): Promise<ParsedAttachment[]> {
    const attachments: ParsedAttachment[] = [];

    // búsqueda simple de content-disposition headers
    const contentDispositionRegex = /Content-Disposition:\s*attachment;\s*filename="?([^";\r\n]+)"?/gi;
    const contentTypeRegex = /Content-Type:\s*([^;\r\n]+)/gi;

    let match;
    const positions: Array<{ filename: string; contentType?: string; start: number }> = [];

    // encontrar todas las posiciones de attachments
    while ((match = contentDispositionRegex.exec(emailContent)) !== null) {
      const filename = match[1];
      const start = match.index;

      // buscar content-type antes de este attachment
      contentTypeRegex.lastIndex = Math.max(0, start - 200);
      const typeMatch = contentTypeRegex.exec(emailContent.substring(Math.max(0, start - 200), start));

      positions.push({
        filename,
        contentType: typeMatch ? typeMatch[1].trim() : 'application/octet-stream',
        start,
      });
    }

    // crear objetos de attachment (sin contenido real por simplicidad)
    for (const pos of positions) {
      attachments.push({
        filename: pos.filename,
        contentType: pos.contentType || 'application/octet-stream',
        size: 0, // simplificado, calcularía el tamaño real en producción
      });
    }

    return attachments;
  }

  /**
   * extrae el cuerpo del mensaje del contenido mime
   */
  extractMessageBody(emailContent: string): { text?: string; html?: string } {
    const result: { text?: string; html?: string } = {};

    // buscar parte de texto plano
    const textMatch = emailContent.match(/Content-Type:\s*text\/plain[^]*?\r?\n\r?\n([^]*?)(?=\r?\n--|\r?\n\r?\n--|\Z)/i);
    if (textMatch) {
      result.text = textMatch[1].trim();
    }

    // buscar parte html
    const htmlMatch = emailContent.match(/Content-Type:\s*text\/html[^]*?\r?\n\r?\n([^]*?)(?=\r?\n--|\r?\n\r?\n--|\Z)/i);
    if (htmlMatch) {
      result.html = htmlMatch[1].trim();
    }

    // si no hay partes mime, asumir que todo el contenido es texto
    if (!result.text && !result.html && !emailContent.includes('Content-Type:')) {
      result.text = emailContent;
    }

    return result;
  }

  /**
   * valida que el email venga de un dominio autorizado
   */
  validateSenderDomain(from: string, allowedDomains: string[]): boolean {
    const domain = from.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    return allowedDomains.some(allowed => {
      const normalizedAllowed = allowed.toLowerCase();
      // soportar wildcard subdomains
      if (normalizedAllowed.startsWith('*.')) {
        const baseDomain = normalizedAllowed.substring(2);
        return domain === baseDomain || domain.endsWith('.' + baseDomain);
      }
      return domain === normalizedAllowed;
    });
  }

  /**
   * verifica si el email pasó las verificaciones de seguridad
   */
  isEmailSecure(parsed: ParsedSESEvent): boolean {
    const checks = [
      parsed.spam?.verdict === 'PASS',
      parsed.virus?.verdict === 'PASS',
      parsed.dkim?.verdict === 'PASS',
      parsed.spf?.verdict === 'PASS',
    ];

    // todos los checks disponibles deben pasar
    return checks.every(check => check !== false);
  }

  /**
   * procesa un evento ses con validaciones
   */
  async processEvent(
    event: SESEvent,
    options?: {
      allowedDomains?: string[];
      requireSecure?: boolean;
      deleteAfterProcess?: boolean;
    }
  ): Promise<{
    valid: ParsedSESEvent[];
    rejected: Array<{ email: ParsedSESEvent; reason: string }>;
  }> {
    const valid: ParsedSESEvent[] = [];
    const rejected: Array<{ email: ParsedSESEvent; reason: string }> = [];

    const parsed = await this.parseEvent(event);

    for (const email of parsed) {
      // validar dominio si se especifica
      if (options?.allowedDomains) {
        if (!this.validateSenderDomain(email.from, options.allowedDomains)) {
          rejected.push({ email, reason: 'Sender domain not allowed' });
          continue;
        }
      }

      // validar seguridad si se requiere
      if (options?.requireSecure && !this.isEmailSecure(email)) {
        rejected.push({ email, reason: 'Failed security checks' });
        continue;
      }

      valid.push(email);

      // eliminar de s3 si se especifica
      if (options?.deleteAfterProcess && email.raw?.ses?.receipt?.action) {
        const action = email.raw.ses.receipt.action as any;
        if (action.type === 'S3' && action.bucketName && action.objectKey) {
          await this.deleteEmailFromS3(action.bucketName, action.objectKey);
        }
      }
    }

    return { valid, rejected };
  }

  /**
   * obtiene cliente ses para operaciones avanzadas
   */
  getSESClient(): SESClient {
    return this.sesClient;
  }

  /**
   * obtiene cliente s3 si está configurado
   */
  getS3Client(): S3Client | undefined {
    return this.s3Client;
  }
}