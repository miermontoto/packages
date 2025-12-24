import { SNSEventRecord } from "aws-lambda";

export interface SNSWrapperConfig {
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export interface PublishOptions {
  topicArn?: string;
  targetArn?: string;
  phoneNumber?: string;
  subject?: string;
  messageAttributes?: Record<string, MessageAttributeValue>;
  messageDeduplicationId?: string;
  messageGroupId?: string;
}

export interface MessageAttributeValue {
  DataType: "String" | "Number" | "Binary";
  StringValue?: string;
  BinaryValue?: Uint8Array;
}

export interface BatchPublishMessage {
  id: string;
  message: string;
  subject?: string;
  messageAttributes?: Record<string, MessageAttributeValue>;
  messageDeduplicationId?: string;
  messageGroupId?: string;
}

export interface PublishResult {
  messageId?: string;
  sequenceNumber?: string;
  success: boolean;
}

export interface BatchPublishResult {
  successful: Array<{ id: string; messageId: string }>;
  failed: Array<{ id: string; error: string }>;
}

export interface ParsedSNSEvent {
  messageId: string;
  topicArn: string;
  subject?: string;
  message: string;
  timestamp: string;
  messageAttributes?: Record<string, any>;
  type: string;
  signatureVersion?: string;
  signature?: string;
  signingCertUrl?: string;
  unsubscribeUrl?: string;
  raw?: SNSEventRecord;
}

export interface SNSReceiverConfig {
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  autoConfirmSubscription?: boolean;
  verifySignature?: boolean;
}

export interface SubscriptionOptions {
  protocol:
    | "http"
    | "https"
    | "email"
    | "email-json"
    | "sms"
    | "sqs"
    | "application"
    | "lambda";
  endpoint: string;
  attributes?: Record<string, string>;
  returnSubscriptionArn?: boolean;
}
