/**
 * @miermontoto/sns
 * wrapper simple para operaciones aws sns
 */

export { SNSPublisher } from "./publisher";
export { SNSReceiver } from "./receiver";

export * from "./helpers";
export * from "./interfaces";

// re-exportar tipos útiles de aws-lambda para conveniencia
export type { SNSEvent, SNSEventRecord, SNSMessage } from "aws-lambda";
