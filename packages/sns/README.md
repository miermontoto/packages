# @miermontoto/sns

Simple TypeScript wrapper for AWS SNS operations.

## Installation

```bash
pnpm add @miermontoto/sns
```

## Usage

### Publishing Messages (SNSPublisher)

```typescript
import { SNSPublisher } from '@miermontoto/sns';

const publisher = new SNSPublisher({
  region: 'us-east-1',
  defaultTopicArn: 'arn:aws:sns:us-east-1:123456789:my-topic'
});

// publicar mensaje simple
await publisher.publish('Hello SNS!', {
  subject: 'Test Message'
});

// publicar json
await publisher.publishJson(
  { action: 'USER_CREATED', userId: 123 },
  { topicArn: 'arn:aws:sns:us-east-1:123456789:events' }
);

// publicar en batch
await publisher.publishBatch(topicArn, [
  { id: '1', message: 'First message' },
  { id: '2', message: 'Second message' }
]);

// publicar sms
await publisher.publish('Your code is 123456', {
  phoneNumber: '+1234567890'
});
```

### Receiving Messages (SNSReceiver)

```typescript
import { SNSReceiver } from '@miermontoto/sns';
import { SNSEvent } from 'aws-lambda';

const receiver = new SNSReceiver({
  region: 'us-east-1',
  autoConfirmSubscription: true
});

// en un lambda handler
export async function handler(event: SNSEvent) {
  const messages = await receiver.parseEvent(event);

  for (const message of messages) {
    console.log('Message ID:', message.messageId);
    console.log('Topic:', message.topicArn);
    console.log('Content:', message.message);

    // parsear contenido json si es necesario
    const data = receiver.parseMessageContent(message.message);
  }

  // con validaciones
  const { valid, rejected } = await receiver.processEvent(event, {
    allowedTopics: ['arn:aws:sns:us-east-1:123456789:my-topic'],
    requiredAttributes: ['userId'],
    verifySignature: true
  });

  // procesar en batch
  await receiver.processBatch(event, async (message) => {
    // procesar cada mensaje
    console.log('Processing:', message.messageId);
  });
}
```

## Features

### SNSPublisher

- Publish simple messages to topics
- Publish JSON data
- Publish batch messages
- Send SMS messages
- Subscribe/unsubscribe to topics
- Manage topic attributes
- Support for message attributes and deduplication

### SNSReceiver

- Parse SNS events from Lambda
- Auto-confirm subscriptions
- Parse JSON message content
- Filter messages by type or topic
- Validate messages with custom rules
- Process messages in batch with error handling
- Extract notification data from various AWS services

## License

CC BY-NC-ND 4.0