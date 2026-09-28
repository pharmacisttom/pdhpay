# Architecture
One Next.js application and one MySQL database form a modular monolith. App Router pages and versioned route handlers are adapters. Modules own use cases. Core owns database access, authentication context, cryptographic primitives, safe errors and API infrastructure. UI components cannot import database services into client bundles.

Dependency direction: app -> modules -> core. Permission catalog is shared data. Services receive an authenticated Context derived from an opaque database session; browser organization IDs never establish tenant scope. Session identity is revalidated against active user and organization records and permissions are reloaded for each request.

Mutations run in transactions together with audit writes. Authentication state transitions use guarded updates and transactions. MySQL-backed rate-limit buckets are shared across PM2 workers. No microservices, connector-specific SDKs, or business modules.

External PHP, Python/FastAPI, n8n and other clients can use versioned REST adapters in a later phase. Cookie mutation endpoints currently require the configured browser Origin; machine-to-machine credentials, webhooks and signed delivery are separate future adapters. Reset-message delivery is a replaceable port, not a notification gateway.
