/**
 * @miermontoto/ses
 * wrapper simple para operaciones aws ses
 */

export { SESReceiver } from "./receiver";
export { SESSender } from "./sender";

export * from "./helpers";
export * from "./interfaces";

// re-exportar tipos útiles de aws-lambda para conveniencia
export type { SESEvent, SESEventRecord, SESMail, SESReceipt } from "aws-lambda";
