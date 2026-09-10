# SPMB — aaPanel deployment checklist

This app is a Next.js 16 Node.js server, not a static export. Run it with
`next start` behind aaPanel's Nginx reverse proxy/SSL.

## Server prerequisites

- Node.js 20.19+ LTS (use the latest Node 20 LTS release supported by aaPanel)
- PostgreSQL, because `prisma/schema.prisma` uses `provider = "postgresql"`
- aaPanel Node.js Project/PM2 and Nginx
- A DNS record and HTTPS certificate
- Cloudinary credentials for `/api/upload`
- A dedicated PostgreSQL role (never `postgres`/root-equivalent for the app)

## Production environment

Create `.env` on the server; never commit it:

```env
DATABASE_URL="postgresql://spmb_app:REPLACE_ME@127.0.0.1:5432/spmb_db?schema=public"
NEXTAUTH_SECRET="REPLACE_WITH_A_NEW_RANDOM_SECRET_AT_LEAST_32_CHARS"
NEXTAUTH_URL="https://spmb.example.sch.id"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
NODE_ENV=production
```

Do not use the values from `.env.example` as production secrets.

## First deployment

Run from a clean Git checkout. Do not deploy a ZIP made from a developer
worktree, because it may contain ignored applicant documents or backup files.

The included initial migration is for an **empty, fresh PostgreSQL database**.
If a database already contains SPMB tables/data, stop and reconcile its schema
with a staging copy before running `prisma migrate deploy`; do not apply an
initial migration blindly to a live database.

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

Start through PM2/aaPanel with:

```bash
npm run start -- -p 3000
```

Proxy the public domain to `127.0.0.1:3000`, enable HTTPS, and do not expose
the Node port directly.

In aaPanel: create a Node Project using the repository directory and Node 20+
LTS, set the start command to `npm run start -- -p 3000`, then attach the
domain through Nginx's reverse-proxy configuration. Run the process as the
restricted web user (`www`), not root. Set `NEXTAUTH_URL` to the final HTTPS
domain before starting PM2.

The upload endpoint limits a file to 2 MB. Nginx's default request-body limit
can be lower, so set `client_max_body_size 5m;` in this site's Nginx vhost.
Use aaPanel WAF/rate limiting for `/api/auth/login`, `/api/auth/register`, and
`/api/upload`; leave PostgreSQL and port 3000 reachable only from localhost.

After HTTPS works, add this Nginx header to the HTTPS virtual host (not the
HTTP redirect host):

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## Before the first production deploy

1. Review `prisma/migrations` and use `prisma migrate deploy`; do not treat
   `prisma db push` as the normal release process.
2. Applicant data, backups, and uploads have been removed from current Git
   tracking. Keep them out of the deployment artifact and in private storage.
   Existing Git history still requires a deliberate history-purge operation
   before a repository is made public.
3. If those files were ever pushed to a remote, purge them from Git history
   and rotate any exposed credentials.
4. Run `npm run lint`, `npm run build`, and `npm run db:status` with production
   environment variables against a staging database first.
5. Smoke-test register, login, document upload, applicant dashboard, every
   admin role, payment evidence, and unauthorized cross-account access.
6. Take a database backup and rehearse restore before opening public traffic.
