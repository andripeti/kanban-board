# Next.js Kanban Task Manager

This project is a Next.js (App Router) application implementing a Task/To-Do Manager with a Kanban board. It includes a MongoDB backend using Mongoose, full CRUD API routes, and a simple React UI.

## Features
- Mongoose-powered `Task` model (title, description, status, priority, timestamps)
- API routes under `/app/api/tasks` implementing POST/GET and `/app/api/tasks/[id]` for PUT/DELETE
- Client-side components: `TaskForm`, `TaskList`, `KanbanBoard`
- Simple fetch wrapper in `lib/api/tasks.js`

## Setup

1. Install dependencies

PowerShell:
```
cd "c:\Users\User\Desktop\Andri\spms"
npm install
```

2. Add environment variable

Create a file named `.env.local` in the project root with the following content:

```
MONGODB_URI="your-mongodb-connection-string"
```

Use a MongoDB connection string (Atlas or local). Example local: `mongodb://localhost:27017/kanban`.

3. Run the development server

PowerShell:
```
npm run dev
```

Open http://localhost:3000 in your browser.

## Project structure

- `app/` - Next.js App Router pages and API routes
- `components/` - React client components
- `lib/db.js` - Mongoose connection helper
- `lib/models/Task.js` - Task schema
- `lib/api/tasks.js` - client fetch wrapper

## Notes
- Ensure `MONGODB_URI` is set before starting the app. The DB helper caches the connection to avoid reinitializing on hot reload.
- The Kanban board uses simple buttons to move tasks between columns (PUT request updates status).
