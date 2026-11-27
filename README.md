# BusCare – Bus Fleet Maintenance and Reliability Management System

Group 3 project (SRS v1.1). A MERN web application to register buses, record services, get daily in-app
reminders for due/overdue maintenance, and view fleet status and maintenance-cost reports.

**Stack:** React 18 + Vite + Material UI + Recharts · Node.js + Express · MongoDB + Mongoose · JWT · node-cron

---

## 1. Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18 or newer (20/22 fine) | `node -v` |
| npm | comes with Node | `npm -v` |
| MongoDB | Community Server 6+ running locally, **or** a free MongoDB Atlas cluster | `mongosh --version` |

> Using Atlas instead of a local MongoDB? Create a free cluster, add a database user, allow your IP, and paste the
> connection string into `MONGO_URI` below (e.g. `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/bus_fleet_maintenance`).

## 2. Run it (first time)

Open **two terminals** in this folder.

### Terminal 1 – backend

```bash
cd backend
npm install
cp .env.example .env          # Windows (cmd): copy .env.example .env
```

Edit `backend/.env` and set a real `JWT_SECRET` (generate one with
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). Keep `MONGO_URI` as is for a local MongoDB.

```bash
npm run seed                  # loads fictional sample data + test accounts (deletes existing data!)
npm run dev                   # API on http://localhost:5000
```

### Terminal 2 – frontend

```bash
cd frontend
npm install
npm run dev                   # app on http://localhost:5173
```

Open **http://localhost:5173** and log in with a test account:

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@fleet.test` | `Admin@1234` |
| Mechanic | `mechanic1@fleet.test` | `Mech@12345` |
| Mechanic | `mechanic2@fleet.test` | `Mech@12345` |

Quick health check: http://localhost:5000/api/health should show `{"status":"ok"}`.

## 3. Roles and what each can do (SRS 2.3, 5.5)

| Feature | Administrator | Mechanic |
|---------|:---:|:---:|
| Log in / log out, view dashboard, reports, buses, bus history, notifications | ✅ | ✅ |
| Search buses by registration number, filter by status | ✅ | ✅ |
| Record and update service records | ✅ | ✅ |
| Add / edit / deactivate buses | ✅ | – |
| Delete service records | ✅ | – |
| Manage users and roles | ✅ | – |
| Configure reminder window | ✅ | – |

Permissions are enforced on the **backend** (JWT + role check), not only hidden in the UI.

## 4. Pages

Login · Register · **Dashboard** (fleet totals, status counts, availability %, upcoming/overdue services, monthly cost)
· **Buses** (search, status filter, add/edit/deactivate) · **Bus detail** (details + chronological service history)
· **Service Records** · **Notifications** (view, mark read, open bus/record; admin sets reminder window)
· **Reports** (cost by month, service type, bus) · **Users & Roles** (admin only).

## 5. Reminders

A `node-cron` job runs once a day (default 08:00 server time, change with `REMINDER_CRON` in `.env`). It finds the
latest service record per bus + service type whose next due date is overdue or within the reminder window
(default 3 days, configurable by the admin on the Notifications page), and creates in-app notifications for every
active user. Duplicate alerts are avoided.

To see reminders **immediately** during a demo, run once from `backend/`:

```bash
npm run reminders
```

(`npm run seed` already runs it once, so notifications exist right after seeding.)

## 6. API summary

All routes except register/login need `Authorization: Bearer <token>`.

| Method & path | Who | Purpose |
|---|---|---|
| `POST /api/auth/register` · `POST /api/auth/login` | public | Register (Mechanic role) / log in |
| `POST /api/auth/logout` · `GET /api/auth/me` | any | Logout / current user |
| `GET/POST /api/users` · `PATCH /api/users/:id` | admin | List, create, change role/active |
| `GET /api/buses?q=&status=` · `GET /api/buses/:id` · `GET /api/buses/:id/history` | any | Search, view, history |
| `POST /api/buses` · `PUT /api/buses/:id` · `PATCH /api/buses/:id/deactivate` | admin | Add, update, deactivate |
| `GET /api/service-records?busId=` · `GET /api/service-records/:id` | any | List, view |
| `POST /api/service-records` · `PUT /api/service-records/:id` | admin, mechanic | Record / update service |
| `DELETE /api/service-records/:id` | admin | Delete service record |
| `GET /api/notifications` · `PATCH /api/notifications/:id/read` | any | List own, mark read |
| `GET /api/reports/dashboard` · `GET /api/reports/costs` | any | Dashboard and cost reports |
| `GET /api/settings/reminder-window` · `PUT /api/settings/reminder-window` | any / admin | Read / configure window |

## 7. Backup and restore (SRS 6.3)

Install the MongoDB Database Tools (`mongodump`, `mongorestore`), then **before every demo or schema change**:

```bash
mongodump --uri="mongodb://127.0.0.1:27017/bus_fleet_maintenance" --out=../db-backup   # backup
mongorestore --uri="mongodb://127.0.0.1:27017" --drop ../db-backup                      # restore
```

Keep the backup folder outside any public web directory. Or simply run `npm run seed` to reset to the sample data.

## 8. Project layout

```
backend/
  server.js              Express app + startup
  config/db.js           MongoDB connection
  models/                User, Bus, ServiceRecord, Notification, Setting (Mongoose)
  middleware/            auth.js (authenticate, authorize), errorHandler.js
  services/              Auth, User, Bus, ServiceRecord, Notification, Reminder, Report, Settings
  routes/                REST routes (thin; call the services)
  jobs/reminderScheduler.js   node-cron daily job
  utils/                 validators, dates, seed.js, runReminders.js
frontend/
  src/pages/             Login, Register, Dashboard, Buses, BusDetail, ServiceRecords, Notifications, Reports, Users
  src/components/        Layout (sidebar), dialogs, chips, stat cards
  src/context/           Auth + toast messages
  src/api/client.js      axios instance (adds the bearer token)
```

## 8a. Design decisions worth knowing (for your viva/report)

* **Self-registration gives the Mechanic role only.** Only an admin can create admins or change roles (SRS 4.1.1 + 4.1.7).
* **Superseded records:** if the same service type is repeated on a bus, only the latest record counts for due-date
  checks; older ones show "—" instead of staying "Overdue" forever.
* **Date-only logic uses UTC days**, so reminders do not depend on the server's time zone.
* **Duplicate-alert rule:** a user gets at most one alert of each type per service record until that record is edited.
* Deactivated buses are hidden from the default list (admins can toggle "Show deactivated") and cannot be edited or serviced;
  their history is kept.
* Dashboard and Reports are visible to both roles (as in sequence diagram 5).

## 9. Troubleshooting

* **`MongoDB connection error`** – MongoDB is not running (start the `mongod` service) or `MONGO_URI` is wrong.
* **`JWT_SECRET is missing or too short`** – you did not create/edit `backend/.env`.
* **Login works but pages show "Cannot reach the server"** – backend is not running on port 5000.
* **Port already in use** – change `PORT` in `backend/.env` and the proxy target in `frontend/vite.config.js`.
* **Need HTTPS / deployment** – SRS requires HTTPS outside localhost; host behind a reverse proxy or a platform that provides TLS,
  set `CLIENT_URL` to the frontend URL, and build the frontend with `VITE_API_URL=https://<backend>/api npm run build`.
