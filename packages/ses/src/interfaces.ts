import { SESEventRecord } from "aws-lambda";

export interface SESWrapperConfig {
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export interface EmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
  returnPath?: string;
  configurationSetName?: string;
  tags?: EmailTag[];
}

export interface EmailTag {
  name: string;
  value: string;
}

export interface EmailContent {
  html?: string;
  text?: string;
}

export interface TemplateEmailOptions extends EmailOptions {
  templateName: string;
  templateData: Record<string, any>;
}

export interface BulkEmailRecipient {
  destination: {
    to: string[];
    cc?: string[];
    bcc?: string[];
  };
  replacementTemplateData?: Record<string, any>;
}

export interface ParsedSESEvent {
  messageId: string;
  source: string;
  timestamp: string;
  subject?: string;
  from: string;
  to: string[];
  content?: string;
  headers: Record<string, string>;
  attachments?: ParsedAttachment[];
  spam?: {
    verdict: string;
    score: number;
  };
  virus?: {
    verdict: string;
  };
  dkim?: {
    verdict: string;
  };
  spf?: {
    verdict: string;
  };
  raw?: SESEventRecord;
}

export interface ParsedAttachment {
  filename: string;
  contentType: string;
  size: number;
  content?: Buffer;
}

export interface SESReceiverConfig {
  bucketName?: string;
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  autoDownloadAttachments?: boolean;
}
