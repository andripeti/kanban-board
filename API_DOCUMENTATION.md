# Kanban Board API Documentation

## Overview
This document describes the API endpoints for team management, user assignment, and email notifications in the Kanban Board application.

## Table of Contents
- [Setup](#setup)
- [Team Management](#team-management)
- [Team Members](#team-members)
- [Task Assignment](#task-assignment)
- [Email Notifications](#email-notifications)

---

## Setup

### Email Configuration

To enable email notifications for task assignments and team invitations, add the following to your `.env.local` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=Kanban Board
SMTP_FROM_EMAIL=your-email@gmail.com
```

**For Gmail users:**
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password at: https://myaccount.google.com/apppasswords
3. Use the App Password (not your regular password) in `SMTP_PASSWORD`

---

## Team Management

### Create Team
Create a new team. The creator is automatically added as an admin.

**Endpoint:** `POST /api/teams`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Development Team"
}
```

**Response:** `201 Created`
```json
{
  "team": {
    "_id": "team_id",
    "name": "Development Team",
    "userId": "creator_user_id",
    "members": [
      {
        "userId": "creator_user_id",
        "email": "creator@example.com",
        "name": "Creator Name",
        "role": "admin",
        "addedAt": "2025-12-18T10:00:00.000Z"
      }
    ],
    "createdAt": "2025-12-18T10:00:00.000Z",
    "updatedAt": "2025-12-18T10:00:00.000Z"
  }
}
```

---

### Get All Teams
Fetch all teams created by the authenticated user.

**Endpoint:** `GET /api/teams`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "teams": [
    {
      "_id": "team_id",
      "name": "Development Team",
      "userId": "user_id",
      "members": [...],
      "createdAt": "2025-12-18T10:00:00.000Z",
      "updatedAt": "2025-12-18T10:00:00.000Z"
    }
  ]
}
```

---

### Get Single Team
Fetch details of a specific team.

**Endpoint:** `GET /api/teams/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "team": {
    "_id": "team_id",
    "name": "Development Team",
    "members": [...],
    ...
  }
}
```

---

### Update Team
Update team name.

**Endpoint:** `PUT /api/teams/{id}`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Team Name"
}
```

**Response:** `200 OK`
```json
{
  "team": {
    "_id": "team_id",
    "name": "Updated Team Name",
    ...
  }
}
```

---

### Delete Team
Delete a team and remove team references from all tasks.

**Endpoint:** `DELETE /api/teams/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "message": "Team deleted successfully"
}
```

---

## Team Members

### Add Member to Team
Add a user to a team by their email. The user must be registered in the system. An email notification is sent to the added user.

**Endpoint:** `POST /api/teams/{id}/members`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "member"
}
```

**Roles:**
- `admin` - Team administrator
- `po` - Product Owner
- `member` - Regular team member (default)

**Response:** `200 OK`
```json
{
  "message": "User added to team successfully",
  "team": {
    "_id": "team_id",
    "name": "Development Team",
    "members": [
      {
        "userId": "user_id",
        "email": "user@example.com",
        "name": "User Name",
        "role": "member",
        "addedAt": "2025-12-18T10:00:00.000Z"
      }
    ],
    ...
  }
}
```

**Error Responses:**
- `404 Not Found` - User with email doesn't exist
- `409 Conflict` - User is already a team member
- `400 Bad Request` - Invalid email or team ID

---

### Remove Member from Team
Remove a user from a team. Team owners cannot be removed.

**Endpoint:** `DELETE /api/teams/{id}/members?userId={userId}`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `userId` - The ID of the user to remove

**Response:** `200 OK`
```json
{
  "message": "Member removed from team successfully",
  "team": {
    ...
  }
}
```

**Error Responses:**
- `400 Bad Request` - Cannot remove team owner
- `404 Not Found` - User is not a member

---

## Task Assignment

### Assign Task to User
Assign a task to a user. The task can be assigned to:
1. Any team member (if the task has a `teamId`)
2. Any registered user (if the task has no `teamId`)

An email notification is automatically sent to the assigned user.

**Endpoint:** `PUT /api/tasks/{id}`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "assignedTo": "user_id",
  "title": "Task Title",
  "description": "Task Description",
  "status": "todo",
  "priority": "high",
  "teamId": "team_id"
}
```

**Response:** `200 OK`
```json
{
  "task": {
    "_id": "task_id",
    "title": "Task Title",
    "description": "Task Description",
    "status": "todo",
    "priority": "high",
    "teamId": "team_id",
    "userId": "creator_user_id",
    "assignedTo": "assigned_user_id",
    "assignedToEmail": "assigned@example.com",
    "assignedToName": "Assigned User",
    "createdAt": "2025-12-18T10:00:00.000Z",
    "updatedAt": "2025-12-18T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Cannot assign to non-team member (when task has teamId)
- `404 Not Found` - Assigned user not found

---

### Unassign Task
Remove assignment from a task.

**Endpoint:** `PUT /api/tasks/{id}`

**Request Body:**
```json
{
  "assignedTo": null
}
```

**Response:** `200 OK`
```json
{
  "task": {
    "_id": "task_id",
    "assignedTo": null,
    "assignedToEmail": null,
    "assignedToName": null,
    ...
  }
}
```

---

## Email Notifications

### Task Assignment Email
When a user is assigned to a task, they receive an email with:
- Task title and description
- Who assigned them
- Link to log in and view the task

**Email Subject:** "You've been assigned to a task: {Task Title}"

**Triggers:**
- When `assignedTo` field is set or changed on a task

---

### Team Invitation Email
When a user is added to a team, they receive an email with:
- Team name
- Their role in the team
- Who invited them
- Link to log in

**Email Subject:** "You've been added to team: {Team Name}"

**Triggers:**
- When a user is added to a team via `POST /api/teams/{id}/members`

---

## Workflow Examples

### Complete Team and Task Assignment Flow

1. **Create a Team**
```bash
curl -X POST http://localhost:3000/api/teams \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Backend Team"}'
```

2. **Add Team Members**
```bash
# Add a developer
curl -X POST http://localhost:3000/api/teams/{team_id}/members \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"email": "dev@example.com", "role": "member"}'

# Add a Product Owner
curl -X POST http://localhost:3000/api/teams/{team_id}/members \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"email": "po@example.com", "role": "po"}'
```

3. **Create a Task**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement API endpoint",
    "description": "Create REST API for user management",
    "priority": "high",
    "teamId": "{team_id}"
  }'
```

4. **Assign Task to Team Member**
```bash
curl -X PUT http://localhost:3000/api/tasks/{task_id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "assignedTo": "{user_id}"
  }'
```

The assigned user will receive an email notification automatically.

---

## Data Models

### Team Schema
```javascript
{
  name: String,
  userId: ObjectId,              // Team creator/owner
  members: [{
    userId: ObjectId,
    email: String,
    name: String,
    role: String,                // 'admin', 'po', 'member'
    addedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Task Schema (Updated)
```javascript
{
  title: String,
  description: String,
  status: String,                // 'todo', 'in-progress', 'done'
  priority: String,              // 'low', 'medium', 'high'
  scheduled: Boolean,
  teamId: ObjectId,              // Reference to Team
  userId: ObjectId,              // Task creator
  assignedTo: ObjectId,          // Assigned user
  assignedToEmail: String,
  assignedToName: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Authorization

- Only team owners (creators) can:
  - Add/remove members
  - Update team name
  - Delete the team

- Only task creators can:
  - Update task details
  - Assign/unassign users
  - Delete the task

- Task assignment rules:
  - If task has `teamId`: Can only assign to team members
  - If task has no `teamId`: Can assign to any registered user

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
