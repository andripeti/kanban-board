# Next.js Kanban Task Manager

An authenticated task manager built with Next.js 14 (App Router), NextAuth Credentials, MongoDB/Mongoose, and a Kanban board powered by dnd-kit.

## Features
- **Auth**: registration + login with NextAuth Credentials (bcrypt-hashed passwords)
- **Task workflows**: Kanban (drag/drop) and table view
- **Teams and projects**: organize tasks by team and/or project, including unassigned work
- **Filtering**: search, team/project filters, and priority chips
- **REST APIs**: App Router route handlers under `app/api/*` with ownership checks

## Tech stack
- Next.js 14 App Router + React
- NextAuth.js (Credentials provider)
- MongoDB + Mongoose
- `@dnd-kit/*` for drag & drop

## Getting started

### Prerequisites
- Node.js 18+
- MongoDB (local) or Docker Desktop

### Install
```powershell
cd "c:\Users\User\Desktop\Andri\spms"
npm install
```

### Environment variables
Create `.env.local` in the project root:

| Key | Required | Example |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | `mongodb://localhost:27017/kanban` |
| `NEXTAUTH_SECRET` | ✅ | (random base64 string) |
| `NEXTAUTH_URL` | ✅ in production | `http://localhost:3000` |

Generate a secret:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Start MongoDB (Docker)
The provided compose file starts MongoDB only:
```powershell
docker compose up -d mongo
```

### Run the app
```powershell
npm run dev
```
Open `http://localhost:3000`, sign up at `/register`, then log in at `/login`.

## Project structure (high level)
```
app/
	page.jsx                    # Dashboard (Sidebar + Header + Kanban/Table)
	login/ register/ new-task/  # Pages
	api/                        # Route handlers (tasks/teams/projects/auth)
components/                   # UI components (KanbanBoardNew, Sidebar, Header, ...)
lib/                          # db/auth helpers + Mongoose models + client API wrappers
docker-compose.yml            # MongoDB service
```

More details about the dashboard page and its filtering rules are in [app/README.md](app/README.md).

## API surface
All endpoints return JSON. Auth-protected routes require a valid session.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create a user (`name`, `email`, `password`) |
| `GET` | `/api/tasks` | List tasks (supports `teamId`, `projectId`, `includeUnassigned`) |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/:id` | Read a single task |
| `PUT` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/api/teams` | List teams |
| `POST` | `/api/teams` | Create a team |
| `GET` | `/api/projects` | List projects (optional `teamId`) |
| `POST` | `/api/projects` | Create a project |

## Scripts
- `npm run dev` – start the dev server
- `npm run build` – production build
- `npm run start` – run the production server

## License
MIT (see `LICENSE`).
