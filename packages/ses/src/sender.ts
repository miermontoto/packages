import {
  SendBulkTemplatedEmailCommand,
  SendEmailCommand,
  SendRawEmailCommand,
  SendTemplatedEmailCommand,
  SESClient,
  SESClientConfig,
  type BulkEmailDestination,
  type Destination,
  type MessageTag,
  type SendBulkTemplatedEmailCommandInput,
  type SendEmailCommandInput,
  type SendRawEmailCommandInput,
  type SendTemplatedEmailCommandInput,
} from "@aws-sdk/client-ses";

import {
  normalizeEmailAddresses,
  validateEmails,
  wasSuccessful,
} from "./helpers";
import {
  BulkEmailRecipient,
  EmailContent,
  EmailOptions,
  EmailTag,
  SESWrapperConfig,
  TemplateEmailOptions,
} from "./interfaces";

const DEFAULT_REGION = "us-east-1";
const MAX_RECIPIENTS = 50;

/**
 * wrapper para operaciones de envío de ses
 */
export class SESSender {
  private client: SESClient;
  private readonly config: SESWrapperConfig;

  constructor(config: SESWrapperConfig = {}) {
    const clientConfig: SESClientConfig = {
      region: config.region ?? process.env.AWS_REGION ?? DEFAULT_REGION,
    };

    if (
      config.credentials?.accessKeyId &&
      config.credentials?.secretAccessKey
    ) {
      clientConfig.credentials = {
        accessKeyId: config.credentials.accessKeyId,
        secretAccessKey: config.credentials.secretAccessKey,
      };
    }

    this.config = config;
    this.client = new SESClient(clientConfig);
  }

  /**
   * obtiene el cliente ses para operaciones avanzadas
   */
  getClient(): SESClient {
    return this.client;
  }

  /**
   * envía un email simple
   */
  async sendEmail(
    options: EmailOptions,
    content: EmailContent
  ): Promise<{ messageId?: string; success: boolean }> {
    // validar emails
    const toAddresses = normalizeEmailAddresses(options.to);
    if (!toAddresses || !validateEmails(toAddresses)) {
      throw new Error("Invalid recipient email address(es)");
    }

    const destination: Destination = {
      ToAddresses: toAddresses,
      CcAddresses: normalizeEmailAddresses(options.cc),
      BccAddresses: normalizeEmailAddresses(options.bcc),
    };

    const params: SendEmailCommandInput = {
      Source: options.from,
      Destination: destination,
      Message: {
        Subject: {
          Data: options.subject,
          Charset: "UTF-8",
        },
        Body: {
          ...(content.html && {
            Html: {
              Data: content.html,
              Charset: "UTF-8",
            },
          }),
          ...(content.text && {
            Text: {
              Data: content.text,
              Charset: "UTF-8",
            },
          }),
        },
      },
      ReplyToAddresses: normalizeEmailAddresses(options.replyTo),
      ReturnPath: options.returnPath,
      ConfigurationSetName: options.configurationSetName,
      Tags: options.tags?.map(
        (tag) =>
          ({
            Name: tag.name,
            Value: tag.value,
          } as MessageTag)
      ),
    };

    const response = await this.client.send(new SendEmailCommand(params));

    return {
      messageId: response.MessageId,
      success: wasSuccessful(response),
    };
  }

  /**
   * envía un email usando template
   */
  async sendTemplatedEmail(
    options: TemplateEmailOptions
  ): Promise<{ messageId?: string; success: boolean }> {
    const toAddresses = normalizeEmailAddresses(options.to);
    if (!toAddresses || !validateEmails(toAddresses)) {
      throw new Error("Invalid recipient email address(es)");
    }

    const destination: Destination = {
      ToAddresses: toAddresses,
      CcAddresses: normalizeEmailAddresses(options.cc),
      BccAddresses: normalizeEmailAddresses(options.bcc),
    };

    const params: SendTemplatedEmailCommandInput = {
      Source: options.from,
      Destination: destination,
      Template: options.templateName,
      TemplateData: JSON.stringify(options.templateData),
      ReplyToAddresses: normalizeEmailAddresses(options.replyTo),
      ReturnPath: options.returnPath,
      ConfigurationSetName: options.configurationSetName,
      Tags: options.tags?.map(
        (tag) =>
          ({
            Name: tag.name,
            Value: tag.value,
          } as MessageTag)
      ),
    };

    const response = await this.client.send(
      new SendTemplatedEmailCommand(params)
    );

    return {
      messageId: response.MessageId,
      success: wasSuccessful(response),
    };
  }

  /**
   * envía emails en bulk usando template
   */
  async sendBulkTemplatedEmail(
    from: string,
    templateName: string,
    recipients: BulkEmailRecipient[],
    defaultTemplateData?: Record<string, any>,
    options?: {
      replyTo?: string[];
      returnPath?: string;
      configurationSetName?: string;
      tags?: EmailTag[];
    }
  ): Promise<{
    successful: string[];
    failed: Array<{ email: string; error: string }>;
  }> {
    // validar límite de destinatarios
    if (recipients.length > MAX_RECIPIENTS) {
      throw new Error(
        `Cannot send to more than ${MAX_RECIPIENTS} recipients at once`
      );
    }

    const destinations: BulkEmailDestination[] = recipients.map(
      (recipient) => ({
        Destination: {
          ToAddresses: recipient.destination.to,
          CcAddresses: recipient.destination.cc,
          BccAddresses: recipient.destination.bcc,
        },
        ReplacementTemplateData: recipient.replacementTemplateData
          ? JSON.stringify(recipient.replacementTemplateData)
          : undefined,
      })
    );

    const params: SendBulkTemplatedEmailCommandInput = {
      Source: from,
      Template: templateName,
      DefaultTemplateData: defaultTemplateData
        ? JSON.stringify(defaultTemplateData)
        : undefined,
      Destinations: destinations,
      ReplyToAddresses: normalizeEmailAddresses(options?.replyTo),
      ReturnPath: options?.returnPath,
      ConfigurationSetName: options?.configurationSetName,
      DefaultTags: options?.tags?.map(
        (tag) =>
          ({
            Name: tag.name,
            Value: tag.value,
          } as MessageTag)
      ),
    };

    const response = await this.client.send(
      new SendBulkTemplatedEmailCommand(params)
    );

    const successful: string[] = [];
    const failed: Array<{ email: string; error: string }> = [];

    response.Status?.forEach((status, index) => {
      const recipient = recipients[index];
      const primaryEmail = recipient.destination.to[0];

      if (status.Status === "Success") {
        successful.push(status.MessageId || primaryEmail);
      } else {
        failed.push({
          email: primaryEmail,
          error: status.Error || "Unknown error",
        });
      }
    });

    return { successful, failed };
  }

  /**
   * envía email raw (con attachments)
   */
  async sendRawEmail(
    rawMessage: Uint8Array | string
  ): Promise<{ messageId?: string; success: boolean }> {
    const params: SendRawEmailCommandInput = {
      RawMessage: {
        Data:
          typeof rawMessage === "string"
            ? new TextEncoder().encode(rawMessage)
            : rawMessage,
      },
    };

    const response = await this.client.send(new SendRawEmailCommand(params));

    return {
      messageId: response.MessageId,
      success: wasSuccessful(response),
    };
  }
}
