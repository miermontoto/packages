# @miermontoto/ses

Simple TypeScript wrapper for AWS SES operations.

## Installation

```bash
pnpm add @miermontoto/ses
```

## Usage

### Sending Emails (SESSender)

```typescript
import { SESSender } from '@miermontoto/ses';

const sender = new SESSender({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key'
  }
});

// enviar email simple
await sender.sendEmail(
  {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test Email'
  },
  {
    html: '<h1>Hello</h1>',
    text: 'Hello'
  }
);

// enviar email con template
await sender.sendTemplatedEmail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Welcome',
  templateName: 'WelcomeTemplate',
  templateData: { name: 'John' }
});
```

### Receiving Emails (SESReceiver)

```typescript
import { SESReceiver } from '@miermontoto/ses';
import { SESEvent } from 'aws-lambda';

const receiver = new SESReceiver({
  region: 'us-east-1',
  bucketName: 'my-ses-bucket'
});

// en un lambda handler
export async function handler(event: SESEvent) {
  const emails = await receiver.parseEvent(event);

  for (const email of emails) {
    console.log('From:', email.from);
    console.log('Subject:', email.subject);
    console.log('Content:', email.content);
  }

  // con validaciones
  const { valid, rejected } = await receiver.processEvent(event, {
    allowedDomains: ['example.com'],
    requireSecure: true,
    deleteAfterProcess: true
  });
}
```

## Features

### SESSender

- Send simple emails
- Send templated emails (using existing templates)
- Send bulk templated emails
- Send raw emails (with attachments)

### SESReceiver

- Parse SES events from Lambda
- Retrieve email content from S3
- Validate sender domains
- Security checks (spam, virus, DKIM, SPF)
- Extract message body and attachments
- Process events with custom validations

## License

CC BY-NC-ND 4.0
