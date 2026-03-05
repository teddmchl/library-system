# Ashbrook Library

A full-stack library management system with a warm editorial aesthetic — think independent bookshop meets the *New York Review of Books*. Playfair Display headings, Crimson Pro body text, cream/parchment backgrounds, deep ink, and rust accents.

Built with **Express**, **MongoDB**, and **EJS** as a showcase of real-world Node.js application architecture.

---

## Features

- **Dashboard** — live stats, overdue alerts, recently added books, genre breakdown
- **Book Catalogue** — full-text search (title/author/ISBN), genre filter, sort controls, paginated grid
- **Book Details** — rendered cover panel with colour-coded spine, metadata, active loans, return history
- **Member Management** — member registration, profile pages, loan history, status badges
- **Loan System** — check-out with availability guards, duplicate-loan prevention, one-click returns
- **Admin CRUD** — create, edit, and safely delete books and members with validation and flash feedback
- **Overdue Detection** — automatic cron job syncs overdue statuses every 6 hours without a user trigger

## Technology Stack

| Layer | Technology |
|---|---|
| Server | Node.js 18+ / Express 4 |
| Database | MongoDB via Mongoose 8 |
| Templates | EJS + express-ejs-layouts |
| Styling | Vanilla CSS (1,285-line design system) |
| Fonts | Playfair Display · Crimson Pro · DM Mono |
| Security | Helmet.js, persistent MongoDB sessions (connect-mongo), body-size limits, regex input escaping |
| Scheduling | node-cron (overdue loan sync) |
| Deployment | Render (free tier) |

---

## Getting Started (Local)

**Prerequisites:** Node.js ≥ 18, MongoDB running locally or an Atlas connection string.

```bash
# 1. Clone
git clone https://github.com/teddmchl/library-system.git
cd library-system

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set MONGODB_URI and SESSION_SECRET

# 4. Seed the database (25 books, 8 members, sample loans)
npm run seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string (local or Atlas) |
| `SESSION_SECRET` | ✅ | Any long random string for signing sessions |
| `PORT` | — | Default: `3000` |
| `NODE_ENV` | — | Set to `production` on Render |

---

## Deploying to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect the GitHub repo — Render auto-detects `render.yaml`
4. Add `MONGODB_URI` as an environment secret (use a MongoDB Atlas URI)
5. Click **Deploy** — Render runs `npm install && npm start`

---

## Project Structure

```
library-system/
├── cron/
│   └── overdueSync.js    # 6-hour cron — marks overdue loans automatically
├── models/
│   ├── Book.js           # Schema with availableCopies, coverColor, virtuals
│   ├── Member.js         # Auto-numbered (LIB-XXXX), status enum
│   └── Loan.js           # isOverdue, daysOverdue, daysRemaining virtuals
├── routes/
│   ├── books.js          # Full CRUD + ReDoS-safe search
│   ├── members.js        # CRUD + loan history
│   ├── loans.js          # Check-out, return, overdue tab filtering
│   └── index.js          # Dashboard aggregation
├── views/                # EJS templates (layout.ejs + nested views)
├── public/
│   └── css/style.css     # Warm editorial design system
├── seed.js               # Seeds 25 books, 8 members, 8 sample loans
├── server.js             # Entry point — Helmet, connect-mongo, cron startup
├── render.yaml           # Render deployment config
└── .env.example          # Environment template
```

---

## Security Notes

- **Helmet.js** sets `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, and 10+ other protective headers on every response.
- **Sessions** are stored in MongoDB via `connect-mongo` — no in-memory state that resets on process restart. Cookies are `httpOnly` and `secure` in production.
- **Search** input is regex-escaped before reaching MongoDB, preventing ReDoS attacks.
- **Body size** is capped at 10 KB on all POST/PUT routes.

---

*Developed by [Tedd Onyesero](https://teddonyesero.vercel.app).*
