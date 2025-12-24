import {
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  PublishBatchCommand,
  PublishCommand,
  SetTopicAttributesCommand,
  SNSClient,
  SNSClientConfig,
  SubscribeCommand,
  UnsubscribeCommand,
  type MessageAttributeValue as AWSMessageAttributeValue,
  type PublishBatchCommandInput,
  type PublishBatchRequestEntry,
  type PublishCommandInput,
} from "@aws-sdk/client-sns";

import { isValidArn, isValidPhoneNumber, wasSuccessful } from "./helpers";
import {
  BatchPublishMessage,
  BatchPublishResult,
  MessageAttributeValue,
  PublishOptions,
  PublishResult,
  SNSWrapperConfig,
  SubscriptionOptions,
} from "./interfaces";

const DEFAULT_REGION = "us-east-1";
const MAX_BATCH_SIZE = 10;

/**
 * wrapper para operaciones de publicación en sns
 */
export class SNSPublisher {
  private client: SNSClient;
  private readonly config: SNSWrapperConfig;
  private defaultTopicArn?: string;

  constructor(config: SNSWrapperConfig & { defaultTopicArn?: string } = {}) {
    const clientConfig: SNSClientConfig = {
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
    this.client = new SNSClient(clientConfig);
    this.defaultTopicArn = (config as any).defaultTopicArn;
  }

  /**
   * obtiene el cliente sns para operaciones avanzadas
   */
  getClient(): SNSClient {
    return this.client;
  }

  /**
   * publica un mensaje en sns
   */
  async publish(
    message: string,
    options: PublishOptions = {}
  ): Promise<PublishResult> {
    // determinar el destino
    const topicArn = options.topicArn || this.defaultTopicArn;
    const targetArn = options.targetArn;
    const phoneNumber = options.phoneNumber;

    if (!topicArn && !targetArn && !phoneNumber) {
      throw new Error(
        "Must provide either topicArn, targetArn, or phoneNumber"
      );
    }

    // validar número de teléfono si se proporciona
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      throw new Error("Invalid phone number format. Must be E.164 format");
    }

    // validar arns si se proporcionan
    if (topicArn && !isValidArn(topicArn)) {
      throw new Error("Invalid topic ARN format");
    }

    if (targetArn && !isValidArn(targetArn)) {
      throw new Error("Invalid target ARN format");
    }

    const params: PublishCommandInput = {
      Message: message,
      TopicArn: topicArn,
      TargetArn: targetArn,
      PhoneNumber: phoneNumber,
      Subject: options.subject,
      MessageDeduplicationId: options.messageDeduplicationId,
      MessageGroupId: options.messageGroupId,
    };

    // convertir atributos de mensaje
    if (options.messageAttributes) {
      params.MessageAttributes = this.convertMessageAttributes(
        options.messageAttributes
      );
    }

    const response = await this.client.send(new PublishCommand(params));

    return {
      messageId: response.MessageId,
      sequenceNumber: response.SequenceNumber,
      success: wasSuccessful(response),
    };
  }

  /**
   * publica mensajes en batch
   */
  async publishBatch(
    topicArn: string,
    messages: BatchPublishMessage[]
  ): Promise<BatchPublishResult> {
    if (!topicArn || !isValidArn(topicArn)) {
      throw new Error("Invalid topic ARN");
    }

    if (messages.length > MAX_BATCH_SIZE) {
      throw new Error(
        `Cannot publish more than ${MAX_BATCH_SIZE} messages at once`
      );
    }

    const entries: PublishBatchRequestEntry[] = messages.map((msg) => ({
      Id: msg.id,
      Message: msg.message,
      Subject: msg.subject,
      MessageAttributes: msg.messageAttributes
        ? this.convertMessageAttributes(msg.messageAttributes)
        : undefined,
      MessageDeduplicationId: msg.messageDeduplicationId,
      MessageGroupId: msg.messageGroupId,
    }));

    const params: PublishBatchCommandInput = {
      TopicArn: topicArn,
      PublishBatchRequestEntries: entries,
    };

    const response = await this.client.send(new PublishBatchCommand(params));

    const successful: Array<{ id: string; messageId: string }> = [];
    const failed: Array<{ id: string; error: string }> = [];

    response.Successful?.forEach((item) => {
      successful.push({
        id: item.Id || "",
        messageId: item.MessageId || "",
      });
    });

    response.Failed?.forEach((item) => {
      failed.push({
        id: item.Id || "",
        error: item.Message || "Unknown error",
      });
    });

    return { successful, failed };
  }

  /**
   * publica mensaje con formato json
   */
  async publishJson(
    data: any,
    options: PublishOptions = {}
  ): Promise<PublishResult> {
    const message = JSON.stringify(data);
    return this.publish(message, options);
  }

  /**
   * publica mensaje con diferentes formatos por protocolo
   */
  async publishFormatted(
    messages: Record<string, string>,
    options: PublishOptions = {}
  ): Promise<PublishResult> {
    const formattedMessage = JSON.stringify(messages);
    return this.publish(formattedMessage, {
      ...options,
      messageAttributes: {
        ...options.messageAttributes,
      },
    });
  }

  /**
   * suscribe un endpoint a un topic
   */
  async subscribe(
    topicArn: string,
    options: SubscriptionOptions
  ): Promise<{ subscriptionArn?: string; success: boolean }> {
    if (!isValidArn(topicArn)) {
      throw new Error("Invalid topic ARN");
    }

    const params = {
      TopicArn: topicArn,
      Protocol: options.protocol,
      Endpoint: options.endpoint,
      Attributes: options.attributes,
      ReturnSubscriptionArn: options.returnSubscriptionArn,
    };

    const response = await this.client.send(new SubscribeCommand(params));

    return {
      subscriptionArn: response.SubscriptionArn,
      success: wasSuccessful(response),
    };
  }

  /**
   * desuscribe de un topic
   */
  async unsubscribe(subscriptionArn: string): Promise<boolean> {
    if (!isValidArn(subscriptionArn)) {
      throw new Error("Invalid subscription ARN");
    }

    const params = {
      SubscriptionArn: subscriptionArn,
    };

    const response = await this.client.send(new UnsubscribeCommand(params));
    return wasSuccessful(response);
  }

  /**
   * lista suscripciones de un topic
   */
  async listSubscriptions(topicArn: string, nextToken?: string) {
    if (!isValidArn(topicArn)) {
      throw new Error("Invalid topic ARN");
    }

    const params = {
      TopicArn: topicArn,
      NextToken: nextToken,
    };

    const response = await this.client.send(
      new ListSubscriptionsByTopicCommand(params)
    );

    return {
      subscriptions: response.Subscriptions,
      nextToken: response.NextToken,
    };
  }

  /**
   * obtiene atributos de un topic
   */
  async getTopicAttributes(topicArn: string) {
    if (!isValidArn(topicArn)) {
      throw new Error("Invalid topic ARN");
    }

    const params = {
      TopicArn: topicArn,
    };

    const response = await this.client.send(
      new GetTopicAttributesCommand(params)
    );
    return response.Attributes;
  }

  /**
   * establece atributos de un topic
   */
  async setTopicAttribute(
    topicArn: string,
    attributeName: string,
    attributeValue: string
  ): Promise<boolean> {
    if (!isValidArn(topicArn)) {
      throw new Error("Invalid topic ARN");
    }

    const params = {
      TopicArn: topicArn,
      AttributeName: attributeName,
      AttributeValue: attributeValue,
    };

    const response = await this.client.send(
      new SetTopicAttributesCommand(params)
    );
    return wasSuccessful(response);
  }

  /**
   * convierte atributos de mensaje al formato aws
   */
  private convertMessageAttributes(
    attributes: Record<string, MessageAttributeValue>
  ): Record<string, AWSMessageAttributeValue> {
    const converted: Record<string, AWSMessageAttributeValue> = {};

    for (const [key, value] of Object.entries(attributes)) {
      converted[key] = {
        DataType: value.DataType,
        StringValue: value.StringValue,
        BinaryValue: value.BinaryValue,
      };
    }

    return converted;
  }

  /**
   * establece el topic por defecto
   */
  setDefaultTopic(topicArn: string) {
    if (!isValidArn(topicArn)) {
      throw new Error("Invalid topic ARN");
    }
    this.defaultTopicArn = topicArn;
  }

  /**
   * obtiene el topic por defecto
   */
  getDefaultTopic(): string | undefined {
    return this.defaultTopicArn;
  }
}
