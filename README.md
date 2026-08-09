# Shuttle Squad

Private, mobile-first badminton score tracker for a small allowlisted group. The app supports WhatsApp OTP login, 1v1/2v2/2v1 matches, standard and casual scores, match history, player profiles, and standings.

## Requirements

- Node.js 20.9 or newer
- MongoDB
- A Meta WhatsApp Cloud API phone number and approved authentication template

## Setup

1. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local`.
2. Copy `WHATSAPP_OTP_ENABLED`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_API_VERSION`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANGUAGE`, and `WHATSAPP_DEFAULT_COUNTRY_CODE` from the Astra Café backend environment. Do not copy Astra's database name or session configuration.
3. The tracker uses the same approved Meta Authentication template and sends its OTP in both the template body and copy-code button parameters. `WHATSAPP_AUTH_TEMPLATE` remains supported only as a temporary backwards-compatible alias for older deployments.
4. Use a new `MONGODB_DB_NAME` such as `badminton_tracker`; never use Astra's database name.
5. Install and run:

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and API at `http://localhost:4000`.

## Add the private members

Membership is intentionally managed directly in MongoDB. Normalize Indian numbers as `+91XXXXXXXXXX` and insert documents into `members`:

```javascript
db.members.insertMany([
  { name: "Admin Name", phone: "+919876543210", color: "#7c3aed", role: "admin", status: "active", createdAt: new Date(), updatedAt: new Date() },
  { name: "Player Name", phone: "+919876543211", color: "#0284c7", role: "member", status: "active", createdAt: new Date(), updatedAt: new Date() }
])
```

Use unique colors for easy recognition. Set `status: "inactive"` to block future logins. To immediately revoke existing access, also update that member's active session records with `revokedAt: new Date()`.

## Production

- Serve both applications over HTTPS.
- Set `SESSION_SECURE=true` and set `CLIENT_ORIGIN` to the exact frontend origin.
- Keep backend environment files outside source control and rotate any credential that is accidentally committed.
- Configure the frontend API URL at build time with `NEXT_PUBLIC_API_BASE_URL`.
- Deploy backend and frontend under the same parent site when possible. If separate sites are required, adjust cookie SameSite policy deliberately.
- Check `/api/health` for process and MongoDB readiness.

## Commands

- `npm run dev` — run frontend and backend
- `npm test` — backend scoring tests
- `npm run lint` — frontend lint
- `npm run build` — frontend production build

## Data behavior

Deleted matches are soft-deleted for auditability. Standings and profiles are calculated from non-deleted matches, so score edits or deletions are reflected immediately. A match creator may edit their match; only an admin may delete one.
