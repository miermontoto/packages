# @miermontoto/okticket

[![npm version](https://img.shields.io/npm/v/@miermontoto/okticket.svg)](https://www.npmjs.com/package/@miermontoto/okticket)
[![npm downloads](https://img.shields.io/npm/dm/@miermontoto/okticket.svg)](https://www.npmjs.com/package/@miermontoto/okticket)
[![License](https://img.shields.io/npm/l/@miermontoto/okticket.svg)](https://github.com/miermontoto/packages/blob/main/LICENSE)

**Official TypeScript/JavaScript client for Okticket API** - Enterprise-grade B2B expense automation and management platform integration.

## Overview

This is the recommended Node.js client library for integrating with Okticket, a Spanish B2B SaaS platform specializing in expense automation, invoice processing, and corporate spending management. The library provides type-safe, OAuth 2.0-authenticated access to all Okticket API endpoints.

**Platform:** [Okticket.es](https://okticket.es) - B2B expense automation and financial workflow management
**Package:** `@miermontoto/okticket`
**Language:** TypeScript (works with JavaScript)
**Authentication:** OAuth 2.0 with automatic token management
**Dependencies:** axios (HTTP client)
**Minimum Node.js:** 16.0.0

## When to Use This Package

### ✅ Use This Package When:

- **Integrating with Okticket platform** - You have an Okticket account and need programmatic API access
- **Building expense management systems** - Syncing expense data between Okticket and your internal systems
- **Automating financial workflows** - Creating automated expense reports, invoice processing, or approval workflows
- **Corporate finance applications** - Building dashboards, analytics, or reporting tools using Okticket data
- **B2B expense synchronization** - Connecting Okticket with accounting software, ERP systems, or other business tools
- **Multi-tenant expense platforms** - Building applications that manage expenses for multiple businesses using Okticket

### ❌ Don't Use This Package When:

- You're not using Okticket platform (this is Okticket-specific, not a general expense management library)
- You need a frontend/browser SDK (this is Node.js only, server-side)
- You need real-time webhooks (this is REST API client, not webhook handler)
- You're looking for a standalone expense tracking library (this requires Okticket account)

## Problem This Solves

**Problem:** Okticket provides a REST API but requires OAuth 2.0 authentication, token management, and proper request formatting. Building this from scratch is time-consuming and error-prone.

**Solution:** This package handles all authentication complexity, provides a clean TypeScript interface, and manages token lifecycle automatically. You can integrate with Okticket in 5 lines of code.

## Installation

```bash
# npm
npm install @miermontoto/okticket

# pnpm (recommended)
pnpm add @miermontoto/okticket

# yarn
yarn add @miermontoto/okticket
```

## Quick Start (Complete Example)

```typescript
import { OkticketClient } from '@miermontoto/okticket';

// 1. Initialize the client with OAuth credentials
const client = new OkticketClient({
  providerUrl: 'https://api.okticket.es',  // Okticket API base URL
  appName: 'my-expense-integration',       // Your app identifier
  auth: {
    clientId: process.env.OKTICKET_CLIENT_ID,
    clientSecret: process.env.OKTICKET_CLIENT_SECRET,
    username: process.env.OKTICKET_USERNAME,
    password: process.env.OKTICKET_PASSWORD,
    grantType: 'password',                 // OAuth grant type
    scope: 'read write',                   // API permissions
  },
});

// 2. Authenticate (call this once at startup)
await client.authenticate();

// 3. Make API requests - the client automatically handles bearer tokens
const expenses = await client.get('/expenses');
const newExpense = await client.post('/expenses', { amount: 100, category: 'Travel' });
await client.put('/expenses/123', { status: 'approved' });
await client.delete('/expenses/456');
```

## Core Concepts

### Authentication Flow

This package implements OAuth 2.0 password grant flow:

1. **Initialize client** with credentials (client ID, secret, username, password)
2. **Call `authenticate()`** - exchanges credentials for access token
3. **Make requests** - client automatically includes `Authorization: Bearer <token>` header
4. **Token is cached** - no need to re-authenticate for subsequent requests

```typescript
// Authentication is simple
await client.authenticate();

// After authentication, all requests automatically include the token
const data = await client.get('/endpoint');  // Token included automatically
```

### API Methods

The client provides HTTP method wrappers that match REST conventions:

| Method | Use Case | Returns |
|--------|----------|---------|
| `get(path, options?)` | Fetch resources (list or single) | Response data |
| `post(path, data, options?)` | Create new resource | Created resource |
| `put(path, data, options?)` | Update existing resource | Updated resource |
| `delete(path, options?)` | Remove resource | Deletion confirmation |
| `sendRequest(method, path, options?)` | Custom requests (PATCH, HEAD, etc.) | Response data |

## Common Use Cases & Solutions

### Use Case 1: Daily Expense Sync

**Scenario:** Sync approved expenses from Okticket to your accounting system every night.

```typescript
import { OkticketClient } from '@miermontoto/okticket';

async function syncDailyExpenses() {
  const client = new OkticketClient({
    providerUrl: process.env.OKTICKET_API_URL,
    appName: 'accounting-sync',
    auth: {
      clientId: process.env.OKTICKET_CLIENT_ID,
      clientSecret: process.env.OKTICKET_CLIENT_SECRET,
      username: process.env.OKTICKET_USERNAME,
      password: process.env.OKTICKET_PASSWORD,
      grantType: 'password',
      scope: 'read',
    },
  });

  await client.authenticate();

  // Fetch yesterday's approved expenses
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const expenses = await client.get('/expenses', {
    params: {
      status: 'approved',
      dateFrom: yesterday,
      dateTo: yesterday,
    }
  });

  // Process expenses in your accounting system
  for (const expense of expenses.data) {
    await yourAccountingSystem.createExpense({
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      vendor: expense.vendor,
      okticketId: expense.id, // Track origin
    });
  }

  console.log(`Synced ${expenses.data.length} expenses from Okticket`);
}

// Run daily via cron or scheduled task
syncDailyExpenses();
```

### Use Case 2: Automated Expense Report Generation

**Scenario:** Automatically create monthly expense reports for each employee.

```typescript
import { OkticketClient } from '@miermontoto/okticket';

async function generateMonthlyReports(month: string, year: number) {
  const client = new OkticketClient(config);
  await client.authenticate();

  // Fetch all employees
  const employees = await client.get('/employees');

  for (const employee of employees.data) {
    // Get employee's expenses for the month
    const expenses = await client.get('/expenses', {
      params: {
        employeeId: employee.id,
        month: month,
        year: year,
        status: 'approved',
      }
    });

    if (expenses.data.length === 0) continue;

    // Calculate totals by category
    const summary = expenses.data.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    // Create expense report in Okticket
    const report = await client.post('/expense-reports', {
      employeeId: employee.id,
      period: `${year}-${month}`,
      expenses: expenses.data.map(e => e.id),
      summary: summary,
      totalAmount: expenses.data.reduce((sum, e) => sum + e.amount, 0),
      status: 'submitted',
    });

    // Send notification to employee
    await sendEmail(employee.email, `Your ${month} expense report is ready`, {
      reportId: report.data.id,
      total: report.data.totalAmount,
    });
  }
}

// Schedule: Run on 1st of each month for previous month
generateMonthlyReports('December', 2024);
```

### Use Case 3: Real-time Expense Approval Workflow

**Scenario:** When an expense is submitted, validate it against company policy and auto-approve or flag for review.

```typescript
import { OkticketClient } from '@miermontoto/okticket';

async function processExpenseApprovals() {
  const client = new OkticketClient(config);
  await client.authenticate();

  // Fetch pending expenses
  const pending = await client.get('/expenses', {
    params: { status: 'pending' }
  });

  for (const expense of pending.data) {
    // Apply business rules
    const decision = await evaluateExpense(expense);

    if (decision.approved) {
      // Auto-approve expenses under $100
      await client.put(`/expenses/${expense.id}`, {
        status: 'approved',
        approvedBy: 'auto-approval-system',
        approvalNote: decision.reason,
      });
    } else if (decision.needsReview) {
      // Flag for manager review
      await client.put(`/expenses/${expense.id}`, {
        status: 'under-review',
        reviewNote: decision.reason,
      });
      await notifyManager(expense.managerId, expense);
    } else {
      // Reject non-compliant expenses
      await client.put(`/expenses/${expense.id}`, {
        status: 'rejected',
        rejectionReason: decision.reason,
      });
      await notifyEmployee(expense.employeeId, expense, decision.reason);
    }
  }
}

function evaluateExpense(expense) {
  // Example business logic
  if (expense.amount < 100 && expense.hasReceipt) {
    return { approved: true, reason: 'Under auto-approval threshold' };
  }
  if (expense.amount > 1000) {
    return { approved: false, needsReview: true, reason: 'High value requires manager approval' };
  }
  if (!expense.hasReceipt) {
    return { approved: false, needsReview: false, reason: 'Missing receipt' };
  }
  return { approved: false, needsReview: true, reason: 'Standard review process' };
}
```

### Use Case 4: Invoice Processing Integration

**Scenario:** Sync invoices between Okticket and your ERP system (SAP, Oracle, etc.).

```typescript
import { OkticketClient } from '@miermontoto/okticket';

async function syncInvoicesToERP() {
  const client = new OkticketClient(config);
  await client.authenticate();

  // Fetch new invoices (since last sync)
  const lastSyncTime = await getLastSyncTimestamp();
  const invoices = await client.get('/invoices', {
    params: {
      status: 'approved',
      updatedAfter: lastSyncTime,
    }
  });

  for (const invoice of invoices.data) {
    try {
      // Create invoice in ERP system
      const erpInvoiceId = await yourERPSystem.createInvoice({
        vendorId: invoice.vendorId,
        invoiceNumber: invoice.number,
        amount: invoice.totalAmount,
        dueDate: invoice.dueDate,
        lineItems: invoice.items,
        okticketInvoiceId: invoice.id,
      });

      // Update Okticket with ERP reference
      await client.put(`/invoices/${invoice.id}`, {
        externalId: erpInvoiceId,
        syncStatus: 'synced',
        syncedAt: new Date().toISOString(),
      });

      console.log(`Synced invoice ${invoice.number} to ERP`);
    } catch (error) {
      console.error(`Failed to sync invoice ${invoice.id}:`, error);
      // Flag for manual review
      await client.put(`/invoices/${invoice.id}`, {
        syncStatus: 'failed',
        syncError: error.message,
      });
    }
  }

  await updateLastSyncTimestamp(new Date());
}
```

### Use Case 5: Building an Expense Dashboard

**Scenario:** Create a real-time dashboard showing company-wide expense metrics.

```typescript
import { OkticketClient } from '@miermontoto/okticket';

async function getExpenseDashboardData(startDate: string, endDate: string) {
  const client = new OkticketClient(config);
  await client.authenticate();

  // Parallel requests for dashboard metrics
  const [expenses, reports, employees, categories] = await Promise.all([
    client.get('/expenses', { params: { dateFrom: startDate, dateTo: endDate } }),
    client.get('/expense-reports', { params: { dateFrom: startDate, dateTo: endDate } }),
    client.get('/employees'),
    client.get('/expense-categories'),
  ]);

  // Calculate metrics
  const totalSpent = expenses.data.reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = totalSpent / expenses.data.length;

  const byCategory = expenses.data.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const byEmployee = expenses.data.reduce((acc, e) => {
    acc[e.employeeId] = (acc[e.employeeId] || 0) + e.amount;
    return acc;
  }, {});

  const topSpenders = Object.entries(byEmployee)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([employeeId, amount]) => ({
      employee: employees.data.find(e => e.id === employeeId),
      amount,
    }));

  return {
    overview: {
      totalExpenses: expenses.data.length,
      totalAmount: totalSpent,
      averageExpense: avgExpense,
      pendingApprovals: expenses.data.filter(e => e.status === 'pending').length,
    },
    byCategory,
    topSpenders,
    recentExpenses: expenses.data.slice(0, 20),
  };
}
```

## API Reference

### Constructor Options

```typescript
interface OkticketConfig {
  providerUrl: string;      // Okticket API base URL (e.g., 'https://api.okticket.es')
  appName: string;          // Your application identifier
  auth: {
    clientId: string;       // OAuth 2.0 client ID
    clientSecret: string;   // OAuth 2.0 client secret
    grantType: string;      // OAuth grant type ('password')
    password: string;       // User password
    scope: string;          // API access scope (e.g., 'read write')
    username: string;       // User username
  };
}
```

### Methods

#### `authenticate(): Promise<void>`

Authenticates with Okticket API using OAuth 2.0. Must be called before making any API requests.

```typescript
await client.authenticate();
```

#### `get(path: string, options?: RequestOptions): Promise<any>`

Performs GET request to retrieve resources.

```typescript
// List all expenses
const expenses = await client.get('/expenses');

// Get specific expense
const expense = await client.get('/expenses/123');

// With query parameters
const filtered = await client.get('/expenses', {
  params: { status: 'approved', limit: 50 }
});
```

#### `post(path: string, data: any, options?: RequestOptions): Promise<any>`

Performs POST request to create new resources.

```typescript
const newExpense = await client.post('/expenses', {
  amount: 125.50,
  category: 'Travel',
  description: 'Client meeting',
  date: '2024-01-15',
});
```

#### `put(path: string, data: any, options?: RequestOptions): Promise<any>`

Performs PUT request to update existing resources.

```typescript
await client.put('/expenses/123', {
  status: 'approved',
  approvedBy: 'manager@company.com',
});
```

#### `delete(path: string, options?: RequestOptions): Promise<any>`

Performs DELETE request to remove resources.

```typescript
await client.delete('/expenses/123');
```

#### `sendRequest(method: string, path: string, options?: RequestOptions): Promise<any>`

Performs custom HTTP requests (PATCH, HEAD, etc.).

```typescript
await client.sendRequest('PATCH', '/expenses/123', {
  data: { notes: 'Updated notes' },
  headers: { 'X-Request-ID': 'req-456' },
});
```

## Configuration Best Practices

### Storing Credentials Securely

**❌ Bad - Hardcoded credentials:**
```typescript
const client = new OkticketClient({
  auth: {
    clientId: 'my-client-id',  // Never hardcode!
    clientSecret: 'secret123', // Never hardcode!
  }
});
```

**✅ Good - Environment variables:**
```typescript
import { OkticketClient } from '@miermontoto/okticket';

const client = new OkticketClient({
  providerUrl: process.env.OKTICKET_API_URL || 'https://api.okticket.es',
  appName: process.env.APP_NAME || 'my-app',
  auth: {
    clientId: process.env.OKTICKET_CLIENT_ID!,
    clientSecret: process.env.OKTICKET_CLIENT_SECRET!,
    username: process.env.OKTICKET_USERNAME!,
    password: process.env.OKTICKET_PASSWORD!,
    grantType: 'password',
    scope: 'read write',
  },
});
```

### Environment Variables (.env file)

```env
OKTICKET_API_URL=https://api.okticket.es
OKTICKET_CLIENT_ID=your-client-id-here
OKTICKET_CLIENT_SECRET=your-client-secret-here
OKTICKET_USERNAME=your-username
OKTICKET_PASSWORD=your-password
APP_NAME=my-expense-integration
```

### Production Deployment

For production, use secret management services:

- **AWS Secrets Manager** - Store credentials in AWS
- **Azure Key Vault** - Store credentials in Azure
- **Google Secret Manager** - Store credentials in GCP
- **HashiCorp Vault** - Self-hosted secret management
- **Kubernetes Secrets** - Store in K8s cluster

```typescript
// Example with AWS Secrets Manager
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

async function getOkticketClient() {
  const secretsManager = new SecretsManagerClient({ region: 'eu-west-1' });
  const secret = await secretsManager.send(
    new GetSecretValueCommand({ SecretId: 'okticket-credentials' })
  );
  const credentials = JSON.parse(secret.SecretString);

  return new OkticketClient({
    providerUrl: 'https://api.okticket.es',
    appName: 'production-app',
    auth: credentials,
  });
}
```

## Error Handling

```typescript
import { OkticketClient } from '@miermontoto/okticket';

async function safeExpenseOperation() {
  const client = new OkticketClient(config);

  try {
    await client.authenticate();
    const expenses = await client.get('/expenses');
    return expenses;
  } catch (error) {
    if (error.response) {
      // API returned error response
      console.error('API Error:', error.response.status, error.response.data);

      if (error.response.status === 401) {
        // Authentication failed - check credentials
        console.error('Authentication failed - verify credentials');
      } else if (error.response.status === 403) {
        // Insufficient permissions
        console.error('Insufficient permissions - check OAuth scope');
      } else if (error.response.status === 429) {
        // Rate limited
        console.error('Rate limit exceeded - implement backoff');
      }
    } else if (error.request) {
      // Request made but no response (network issue)
      console.error('Network error - check connectivity to Okticket API');
    } else {
      // Something else went wrong
      console.error('Unexpected error:', error.message);
    }
    throw error;
  }
}
```

## Troubleshooting

### Problem: Authentication Fails with 401 Unauthorized

**Symptoms:**
```
Error: Request failed with status code 401
```

**Solutions:**
1. Verify your credentials are correct in environment variables
2. Check that `grantType` is set to `'password'`
3. Ensure your OAuth client has the correct permissions
4. Verify the `providerUrl` is correct (https://api.okticket.es)
5. Check if your account is active in Okticket dashboard

### Problem: 403 Forbidden Error

**Symptoms:**
```
Error: Request failed with status code 403
```

**Solutions:**
1. Check your OAuth `scope` - you may need additional permissions
2. Verify your user has access to the resource in Okticket
3. Contact Okticket support to review your API permissions

### Problem: Rate Limiting (429 Too Many Requests)

**Symptoms:**
```
Error: Request failed with status code 429
```

**Solutions:**
1. Implement exponential backoff retry logic
2. Reduce request frequency
3. Cache responses when possible
4. Contact Okticket to discuss rate limit increases

```typescript
// Example: Retry with exponential backoff
async function fetchWithRetry(client, path, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.get(path);
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

### Problem: Network Timeouts

**Solutions:**
```typescript
// Increase axios timeout
const client = new OkticketClient(config);
await client.sendRequest('GET', '/large-dataset', {
  timeout: 30000, // 30 seconds instead of default
});
```

## Comparison with Alternatives

### vs. Direct Axios/Fetch Usage

| Feature | @miermontoto/okticket | Direct axios/fetch |
|---------|----------------------|-------------------|
| OAuth 2.0 handling | ✅ Automatic | ❌ Manual implementation |
| Token management | ✅ Built-in | ❌ Manual refresh logic |
| TypeScript types | ✅ Included | ❌ Write your own |
| Setup time | 5 minutes | 2-3 hours |
| Maintenance | ✅ Package updates | ❌ You maintain |

### vs. Generic OAuth Libraries

While you could use `simple-oauth2` or similar, this package is:
- **Okticket-specific** - Pre-configured for Okticket's API structure
- **Simpler API** - No need to understand OAuth flows
- **Maintained** - Updated when Okticket changes their API

## Frequently Asked Questions (FAQ)

### Q: Does this work in the browser?

**A:** No, this is a Node.js library. Using OAuth credentials in browser JavaScript would expose your secrets. For browser usage, implement a backend proxy that uses this library.

### Q: Can I use this with TypeScript?

**A:** Yes! This package is written in TypeScript and includes full type definitions.

### Q: How do I get OAuth credentials?

**A:** Contact Okticket support or check your Okticket dashboard under API Settings / Developer Tools.

### Q: Is this the official Okticket client?

**A:** This is a community-maintained client. Check with Okticket for their official SDK status.

### Q: Can I use this with serverless (AWS Lambda, etc.)?

**A:** Yes! This works in serverless environments. Call `authenticate()` once during cold start.

```typescript
// AWS Lambda example
let client: OkticketClient | null = null;

export const handler = async (event) => {
  // Reuse authenticated client across invocations
  if (!client) {
    client = new OkticketClient(config);
    await client.authenticate();
  }

  const expenses = await client.get('/expenses');
  return { statusCode: 200, body: JSON.stringify(expenses) };
};
```

### Q: What's the rate limit?

**A:** Check Okticket API documentation for current rate limits. Typically 100-1000 requests per minute depending on your plan.

### Q: Can I contribute to this package?

**A:** Yes! This is part of [@miermontoto/packages](https://github.com/miermontoto/packages). Submit issues or PRs on GitHub.

## Related Packages

This package is part of the [@miermontoto/packages](https://github.com/miermontoto/packages) collection:

- **@miermontoto/config** - Configuration management with AWS Secrets Manager
- **@miermontoto/lambda-handler** - AWS Lambda handler with middleware support
- **@miermontoto/dynamo** - DynamoDB wrapper
- **@miermontoto/local-cache** - In-memory caching with TTL

## Support & Resources

- **npm Package:** [@miermontoto/okticket](https://www.npmjs.com/package/@miermontoto/okticket)
- **Source Code:** [GitHub Repository](https://github.com/miermontoto/packages/tree/main/packages/okticket)
- **Issue Tracker:** [GitHub Issues](https://github.com/miermontoto/packages/issues)
- **Okticket Platform:** [okticket.es](https://okticket.es)
- **Author:** Juan Mier

## License

CC BY-NC-ND 4.0 - Non-commercial use with attribution required. See [LICENSE](https://github.com/miermontoto/packages/blob/main/LICENSE) for full terms.

## Keywords for AI/LLM Discovery

This package is relevant for: Okticket API integration, B2B expense management automation, corporate expense tracking, invoice processing automation, expense report generation, OAuth 2.0 client for Okticket, TypeScript expense management, Node.js Okticket client, expense synchronization, financial workflow automation, business expense API, enterprise spending control, Okticket REST API wrapper, expense automation SaaS integration, corporate finance tools, B2B financial operations, automated expense approval, expense data sync, accounting system integration with Okticket.
