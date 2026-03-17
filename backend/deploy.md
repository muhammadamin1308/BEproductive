# Backend Deployment Guide (Heroku)

## Prerequisites

- Heroku CLI installed and logged in (`heroku login`)
- Heroku remote configured (one-time setup, see below)

---

## One-Time Setup

Add the Heroku remote from the **repo root**:

```bash
heroku git:remote -a beproductive-backend
```

---

## Deploy

Run from the **repo root**:

```bash
git push heroku $(git subtree split --prefix backend master):master --force
```

> Use `--force` because Heroku's history diverges from the monorepo subtree history.

---

## Apply Schema Changes (after editing `schema.prod.prisma`)

After deploying, sync the production PostgreSQL database:

```bash
heroku run:detached npm run prod:push --app beproductive-backend
```

Then confirm it succeeded:

```bash
heroku logs --app beproductive-backend --tail
# Look for: 🚀  Your database is now in sync with your Prisma schema.
```

> `prod:push` uses `prisma db push --schema=schema.prod.prisma` which applies schema
> changes directly without requiring migration history. Safe for additive changes
> (new columns, new tables). For destructive changes (dropping columns/tables),
> do it manually via the Heroku Postgres dashboard or `heroku pg:psql`.

---

## Check App Status

```bash
heroku logs --app beproductive-backend --tail
heroku ps --app beproductive-backend
```

---

## Environment Variables

| Variable         | Description                        |
|------------------|------------------------------------|
| `DATABASE_URL`   | Heroku Postgres connection string  |
| `JWT_SECRET`     | Secret for signing JWT tokens      |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID           |
| `FRONTEND_URL`   | Optional extra CORS origin (e.g. a staging URL). The production origins `https://doable.muhammadamin.tech` and `https://beproductive.muhammadamin.tech` are already allowed in code. |

To set or update a variable:

```bash
heroku config:set KEY=value --app beproductive-backend
```

---

## Notes

- Sessions (JWT cookie) expire after **7 days**.
- The app uses `schema.prod.prisma` in production (PostgreSQL) and `prisma/schema.prisma` locally (SQLite).
- Never run `prisma migrate deploy` on this app — the DB was created without migration history. Always use `prod:push` instead.
