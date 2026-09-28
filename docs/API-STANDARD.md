# API v1
Prefix: /api/v1. Success: `{success:true,data,meta:{requestId}}`. Failure: `{success:false,error:{code,message},meta:{requestId}}`. Responses are no-store. No raw database errors or stack traces.

GET collection endpoints use page (default 1), pageSize (default 20, max 100), q (max 100 characters) and sort (createdAt or name where supported). Unknown parameters are rejected. Ordering is deterministic by timestamp and ID. Tenant scope is never a query parameter. Pagination metadata includes page, pageSize and total. Audit supports exact action filtering.

POST/PATCH/DELETE require application/json and an Origin matching APP_URL. Maximum body size is 16 KiB. UUID path parameters and strict request schemas reject unknown fields. 200 success, 400 invalid input, 401 missing/expired authentication, 403 denied permission/Origin, 404 tenant-scoped resource not found, 409 conflict, 429 rate limit, 500 safe internal error.

Auth endpoints: POST auth/login (organization slug, email, password), auth/2fa (code; pending challenge cookie), auth/logout, auth/forgot-password, auth/reset-password (token,password), auth/change-password (currentPassword,password). GET auth/me returns safe identity and permissions. POST auth/2fa/setup (currentPassword), auth/2fa/enable (code), auth/2fa/disable and auth/2fa/recovery (currentPassword,code). Setup returns provisioning URI and QR; clients must treat both as secrets.

GET/POST users; PATCH/DELETE users/:id (DELETE disables). GET/POST roles; PATCH/DELETE roles/:id. Role writes include permission names; user writes include roleIds. GET permissions; GET/PATCH organizations (current organization only); GET audit; GET/PATCH settings (allowlisted preferences only); GET dashboard. Authentication and permission enforcement occur before protected reads/writes. Reports, machine credentials and public registration are deferred.

Additive changes remain v1. Breaking contracts require v2 and a documented migration/deprecation period.
