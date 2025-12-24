# @miermontoto/okticket

Simple TypeScript wrapper for Okticket API operations.

## Installation

```bash
pnpm add @miermontoto/okticket
```

## Usage

```typescript
import { OkticketClient } from '@miermontoto/okticket';

const client = new OkticketClient({
  providerUrl: 'https://api.okticket.es',
  appName: 'my-app',
  auth: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    grantType: 'password',
    password: 'your-password',
    scope: 'your-scope',
    username: 'your-username',
  },
});

// autenticar con la API
await client.authenticate();

// peticiones GET
const users = await client.get('/users');

// peticiones POST
const result = await client.post('/users', { name: 'John' });

// peticiones PUT
await client.put('/users/123', { name: 'Jane' });

// peticiones DELETE
await client.delete('/users/123');

// petición personalizada
await client.sendRequest('PATCH', '/users/123', {
  data: { status: 'active' },
  headers: { 'X-Custom-Header': 'value' },
});
```

## Features

- OAuth authentication with automatic token management
- Convenience methods for GET, POST, PUT, DELETE
- Custom request options (headers, content-type, response type)
- Automatic Bearer token injection
- Configurable base URL

## License

CC BY-NC-ND 4.0
