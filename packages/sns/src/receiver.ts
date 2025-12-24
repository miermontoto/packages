import {
  SNSClient,
  SNSClientConfig,
  ConfirmSubscriptionCommand,
} from "@aws-sdk/client-sns";
import {
  SNSEvent,
  SNSEventRecord,
  SNSMessage,
} from "aws-lambda";

import { tryParseJson, extractMessageAttributes } from "./helpers";
import { SNSReceiverConfig, ParsedSNSEvent } from "./interfaces";

const DEFAULT_REGION = "us-east-1";

/**
 * wrapper para recibir y parsear eventos sns
 */
export class SNSReceiver {
  private client: SNSClient;
  private config: SNSReceiverConfig;

  constructor(config: SNSReceiverConfig = {}) {
    const clientConfig: SNSClientConfig = {
      region: config.region ?? process.env.AWS_REGION ?? DEFAULT_REGION,
    };

    if (config.credentials?.accessKeyId && config.credentials?.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.credentials.accessKeyId,
        secretAccessKey: config.credentials.secretAccessKey,
      };
    }

    this.config = config;
    this.client = new SNSClient(clientConfig);
  }

  /**
   * parsea un evento sns de lambda
   */
  async parseEvent(event: SNSEvent): Promise<ParsedSNSEvent[]> {
    const parsedMessages: ParsedSNSEvent[] = [];

    for (const record of event.Records) {
      const parsed = await this.parseRecord(record);
      parsedMessages.push(parsed);
    }

    return parsedMessages;
  }

  /**
   * parsea un record individual de sns
   */
  async parseRecord(record: SNSEventRecord): Promise<ParsedSNSEvent> {
    const sns = record.Sns;

    const parsed: ParsedSNSEvent = {
      messageId: sns.MessageId,
      topicArn: sns.TopicArn,
      subject: sns.Subject,
      message: sns.Message,
      timestamp: sns.Timestamp,
      type: sns.Type,
      signatureVersion: sns.SignatureVersion,
      signature: sns.Signature,
      signingCertUrl: sns.SigningCertUrl,
      unsubscribeUrl: sns.UnsubscribeUrl,
      raw: record,
    };

    // parsear atributos del mensaje si existen
    if (sns.MessageAttributes) {
      parsed.messageAttributes = extractMessageAttributes(sns.MessageAttributes);
    }

    // auto-confirmar suscripción si está configurado
    if (
      this.config.autoConfirmSubscription &&
      sns.Type === "SubscriptionConfirmation" &&
      sns.Token &&
      sns.TopicArn
    ) {
      await this.confirmSubscription(sns.TopicArn, sns.Token);
    }

    return parsed;
  }

  /**
   * parsea el contenido del mensaje (intenta parsear json)
   */
  parseMessageContent(message: string): any {
    return tryParseJson(message);
  }

  /**
   * extrae un mensaje específico de un evento con un solo record
   */
  extractSingleMessage(event: SNSEvent): ParsedSNSEvent | null {
    if (event.Records.length === 0) {
      return null;
    }

    if (event.Records.length > 1) {
      console.warn("Multiple records found, returning first one");
    }

    return this.parseRecordSync(event.Records[0]);
  }

  /**
   * parsea un record de forma síncrona (sin auto-confirmación)
   */
  private parseRecordSync(record: SNSEventRecord): ParsedSNSEvent {
    const sns = record.Sns;

    const parsed: ParsedSNSEvent = {
      messageId: sns.MessageId,
      topicArn: sns.TopicArn,
      subject: sns.Subject,
      message: sns.Message,
      timestamp: sns.Timestamp,
      type: sns.Type,
      signatureVersion: sns.SignatureVersion,
      signature: sns.Signature,
      signingCertUrl: sns.SigningCertUrl,
      unsubscribeUrl: sns.UnsubscribeUrl,
      raw: record,
    };

    if (sns.MessageAttributes) {
      parsed.messageAttributes = extractMessageAttributes(sns.MessageAttributes);
    }

    return parsed;
  }

  /**
   * confirma una suscripción de sns
   */
  async confirmSubscription(
    topicArn: string,
    token: string
  ): Promise<{ subscriptionArn?: string; success: boolean }> {
    try {
      const params = {
        TopicArn: topicArn,
        Token: token,
      };

      const response = await this.client.send(new ConfirmSubscriptionCommand(params));

      return {
        subscriptionArn: response.SubscriptionArn,
        success: true,
      };
    } catch (error) {
      console.error("Error confirming subscription:", error);
      return { success: false };
    }
  }

  /**
   * verifica la firma del mensaje sns (simplificado)
   */
  verifyMessageSignature(parsed: ParsedSNSEvent): boolean {
    // implementación simplificada
    // en producción se debería verificar la firma con el certificado
    if (!this.config.verifySignature) {
      return true;
    }

    if (!parsed.signature || !parsed.signingCertUrl) {
      return false;
    }

    // aquí iría la verificación real de la firma
    console.warn("Signature verification not fully implemented");
    return true;
  }

  /**
   * filtra mensajes por tipo
   */
  filterByType(messages: ParsedSNSEvent[], type: string): ParsedSNSEvent[] {
    return messages.filter((msg) => msg.type === type);
  }

  /**
   * filtra mensajes por topic arn
   */
  filterByTopic(messages: ParsedSNSEvent[], topicArn: string): ParsedSNSEvent[] {
    return messages.filter((msg) => msg.topicArn === topicArn);
  }

  /**
   * procesa mensajes con validaciones
   */
  async processEvent(
    event: SNSEvent,
    options?: {
      allowedTopics?: string[];
      requiredAttributes?: string[];
      verifySignature?: boolean;
    }
  ): Promise<{
    valid: ParsedSNSEvent[];
    rejected: Array<{ message: ParsedSNSEvent; reason: string }>;
  }> {
    const valid: ParsedSNSEvent[] = [];
    const rejected: Array<{ message: ParsedSNSEvent; reason: string }> = [];

    const parsed = await this.parseEvent(event);

    for (const message of parsed) {
      // validar topic si se especifica
      if (options?.allowedTopics) {
        if (!options.allowedTopics.includes(message.topicArn)) {
          rejected.push({ message, reason: "Topic not allowed" });
          continue;
        }
      }

      // validar atributos requeridos
      if (options?.requiredAttributes) {
        const missingAttributes = options.requiredAttributes.filter(
          (attr) => !message.messageAttributes?.[attr]
        );

        if (missingAttributes.length > 0) {
          rejected.push({
            message,
            reason: `Missing required attributes: ${missingAttributes.join(", ")}`,
          });
          continue;
        }
      }

      // verificar firma si se requiere
      if (options?.verifySignature || this.config.verifySignature) {
        if (!this.verifyMessageSignature(message)) {
          rejected.push({ message, reason: "Invalid signature" });
          continue;
        }
      }

      valid.push(message);
    }

    return { valid, rejected };
  }

  /**
   * extrae mensajes de diferentes tipos de notificación
   */
  extractNotificationData(message: ParsedSNSEvent): any {
    const parsedMessage = this.parseMessageContent(message.message);

    // si es una notificación de s3
    if (parsedMessage?.Records?.[0]?.s3) {
      return {
        type: "s3",
        bucket: parsedMessage.Records[0].s3.bucket.name,
        key: parsedMessage.Records[0].s3.object.key,
        eventName: parsedMessage.Records[0].eventName,
        data: parsedMessage.Records[0].s3,
      };
    }

    // si es una notificación de cloudwatch
    if (parsedMessage?.AlarmName) {
      return {
        type: "cloudwatch",
        alarmName: parsedMessage.AlarmName,
        newState: parsedMessage.NewStateValue,
        reason: parsedMessage.NewStateReason,
        data: parsedMessage,
      };
    }

    // si es una notificación de ses
    if (parsedMessage?.notificationType) {
      return {
        type: "ses",
        notificationType: parsedMessage.notificationType,
        mail: parsedMessage.mail,
        data: parsedMessage,
      };
    }

    // retornar el mensaje parseado tal cual
    return parsedMessage;
  }

  /**
   * procesa mensajes en batch con manejo de errores
   */
  async processBatch(
    event: SNSEvent,
    processor: (message: ParsedSNSEvent) => Promise<void>
  ): Promise<{
    processed: string[];
    errors: Array<{ messageId: string; error: string }>;
  }> {
    const processed: string[] = [];
    const errors: Array<{ messageId: string; error: string }> = [];

    const messages = await this.parseEvent(event);

    for (const message of messages) {
      try {
        await processor(message);
        processed.push(message.messageId);
      } catch (error: any) {
        errors.push({
          messageId: message.messageId,
          error: error.message || "Processing failed",
        });
      }
    }

    return { processed, errors };
  }

  /**
   * obtiene cliente sns para operaciones avanzadas
   */
  getClient(): SNSClient {
    return this.client;
  }
}