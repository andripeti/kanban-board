# Quick Start Guide: Team Management & Task Assignment

This guide will help you quickly set up and use the new team management and task assignment features with email notifications.

## 📋 Prerequisites

1. Users must be registered in the system before they can be added to teams or assigned tasks
2. Email configuration is required for notifications to work

---

## 🚀 Step 1: Configure Email (Required)

### Option A: Using Gmail

1. **Enable 2-Factor Authentication** on your Google account (if not already enabled)

2. **Generate an App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" (name it "Kanban Board")
   - Click "Generate"
   - Copy the 16-character password

3. **Update `.env.local`:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_FROM_NAME=Kanban Board
   SMTP_FROM_EMAIL=your-gmail@gmail.com
   ```

### Option B: Using Other Email Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

**Outlook/Office365:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### Test Your Email Configuration

Run the test script:
```bash
node test-email.js
```

If successful, you'll see:
```
✅ SMTP connection successful!
✅ Test email sent successfully!
🎉 Email configuration is working correctly!
```

---

## 🔧 Step 2: Start the Application

```bash
npm run dev
```

The application will be available at: http://localhost:3000

---

## 👥 Step 3: Create a Team

### Via API (using curl, Postman, or similar):

```bash
curl -X POST http://localhost:3000/api/teams \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Development Team"
  }'
```

**Response:**
```json
{
  "team": {
    "_id": "675c1234...",
    "name": "Development Team",
    "members": [
      {
        "userId": "675c5678...",
        "email": "you@example.com",
        "name": "Your Name",
        "role": "admin"
      }
    ]
  }
}
```

**Note:** You (the creator) are automatically added as an admin.

---

## 👤 Step 4: Add Team Members

### First, ensure users are registered:

Users must register accounts before being added to teams.

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Then, add them to your team:

```bash
curl -X POST http://localhost:3000/api/teams/{TEAM_ID}/members \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "email": "john@example.com",
    "role": "member"
  }'
```

**Available Roles:**
- `admin` - Full team management permissions
- `po` - Product Owner
- `member` - Regular team member (default)

**What happens:**
✅ User is added to the team
📧 User receives an email notification

---

## 📝 Step 5: Create a Task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "title": "Implement login feature",
    "description": "Create login page with authentication",
    "priority": "high",
    "teamId": "YOUR_TEAM_ID"
  }'
```

**Response:**
```json
{
  "task": {
    "_id": "675c9012...",
    "title": "Implement login feature",
    "description": "Create login page with authentication",
    "status": "todo",
    "priority": "high",
    "teamId": "675c1234...",
    "userId": "675c5678..."
  }
}
```

---

## ✅ Step 6: Assign Task to Team Member

```bash
curl -X PUT http://localhost:3000/api/tasks/{TASK_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "assignedTo": "MEMBER_USER_ID"
  }'
```

**What happens:**
✅ Task is assigned to the user
✅ Task stores user's email and name
📧 User receives an email notification with:
- Task title and description
- Who assigned them
- Priority level

---

## 📧 Email Notifications

### Task Assignment Email Example:

**Subject:** You've been assigned to a task: Implement login feature

**Body:**
```
Hi John,

You have been assigned to a new task by Jane Smith.

Task: Implement login feature
Description: Create login page with authentication

Please log in to the Kanban Board to view more details and start working on this task.
```

### Team Invitation Email Example:

**Subject:** You've been added to team: Development Team

**Body:**
```
Hi John,

You have been added to the team Development Team by Jane Smith.

Team: Development Team
Your Role: MEMBER

Please log in to the Kanban Board to start collaborating with your team.
```

---

## 🔍 Common Use Cases

### 1. Product Owner Assigns Task to Developer

```javascript
// PO creates a task
POST /api/tasks
{
  "title": "Fix login bug",
  "description": "Users can't log in with special characters",
  "priority": "high",
  "teamId": "team_id"
}

// PO assigns to developer
PUT /api/tasks/{taskId}
{
  "assignedTo": "developer_user_id"
}

// Developer receives email notification
```

### 2. Admin Builds a Team

```javascript
// Create team
POST /api/teams
{ "name": "Frontend Team" }

// Add Product Owner
POST /api/teams/{teamId}/members
{ "email": "po@example.com", "role": "po" }

// Add Developers
POST /api/teams/{teamId}/members
{ "email": "dev1@example.com", "role": "member" }

POST /api/teams/{teamId}/members
{ "email": "dev2@example.com", "role": "member" }

// All members receive email notifications
```

### 3. Reassign a Task

```javascript
// Reassign to different team member
PUT /api/tasks/{taskId}
{
  "assignedTo": "another_user_id"
}

// New assignee receives email notification
```

### 4. Unassign a Task

```javascript
// Remove assignment
PUT /api/tasks/{taskId}
{
  "assignedTo": null
}

// No email is sent when unassigning
```

---

## 🎯 Assignment Rules

### Tasks with Team:
- ✅ Can only assign to team members
- ❌ Cannot assign to users outside the team
- 📧 Email sent to assigned member

### Tasks without Team:
- ✅ Can assign to any registered user
- 📧 Email sent to assigned user

### Authorization:
- 🔒 Only team owners can add/remove members
- 🔒 Only task creators can assign tasks
- 🔒 Team owners cannot be removed from their teams

---

## 🛠️ Troubleshooting

### Email Not Sending

**Problem:** Users aren't receiving emails

**Solutions:**
1. Run `node test-email.js` to verify email config
2. Check `.env.local` for correct SMTP credentials
3. For Gmail: Make sure you're using App Password, not regular password
4. Check server logs for email errors: `npm run dev`
5. Verify recipient email exists in User collection

### Cannot Add User to Team

**Problem:** Getting "User with this email does not exist"

**Solution:**
- User must register first via `/api/auth/register`
- Check email spelling (case-insensitive)
- Verify user exists: Query MongoDB for the email

### Cannot Assign Task

**Problem:** Getting "Cannot assign task to user who is not a team member"

**Solution:**
- If task has `teamId`, assignee must be a team member
- Add user to team first, then assign task
- Or remove `teamId` from task to assign to any user

### Email Sent But Not Received

**Checklist:**
- ✅ Check spam/junk folder
- ✅ Verify recipient email is correct
- ✅ Check email provider's sent mail
- ✅ Wait a few minutes (some providers have delays)
- ✅ Check server logs for email send confirmation

---

## 📖 Next Steps

1. **Read Full Documentation:**
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
   - [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details

2. **Build UI Components:**
   - Team management interface
   - Member selection dropdown
   - Task assignment UI
   - Email notification preferences

3. **Enhance Features:**
   - Add task comments
   - Implement due dates
   - Create team dashboards
   - Add activity logs

---

## 🆘 Need Help?

1. Check the error message in the API response
2. Review server logs: `npm run dev`
3. Test email config: `node test-email.js`
4. Verify MongoDB is running: `docker-compose up -d` or check local instance
5. Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for endpoint details

---

## ✨ Quick Reference

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/teams` | POST | Create team |
| `/api/teams` | GET | List all teams |
| `/api/teams/{id}` | GET | Get team details |
| `/api/teams/{id}` | PUT | Update team |
| `/api/teams/{id}` | DELETE | Delete team |
| `/api/teams/{id}/members` | POST | Add member |
| `/api/teams/{id}/members?userId={id}` | DELETE | Remove member |
| `/api/tasks/{id}` | PUT | Assign task (set assignedTo) |

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/kanban-board
NEXTAUTH_SECRET=your-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

**Happy Task Managing! 🎉**
