# Implementation Summary: Team Management & Task Assignment with Email Notifications

## Overview
This document summarizes the implementation of team management, user assignment, and email notification features for the Kanban Board application.

---

## What's Been Implemented

### 1. Database Models

#### Team Model (`lib/models/Team.js`) - **NEW**
- Team name and creator tracking
- Members array with user details and roles (admin, po, member)
- Timestamps for creation and updates
- Unique constraint per user (can't have duplicate team names)

#### Task Model (`lib/models/Task.js`) - **UPDATED**
- Added `assignedTo` field (ObjectId reference to User)
- Added `assignedToEmail` and `assignedToName` for easy access
- Changed `teamId` from String to ObjectId reference to Team

### 2. API Endpoints

#### Team Management APIs
- `POST /api/teams` - Create a new team
- `GET /api/teams` - Get all user's teams
- `GET /api/teams/[id]` - Get single team details
- `PUT /api/teams/[id]` - Update team name
- `DELETE /api/teams/[id]` - Delete team (removes team references from tasks)

#### Team Member Management APIs
- `POST /api/teams/[id]/members` - Add user to team by email (with email notification)
- `DELETE /api/teams/[id]/members?userId={userId}` - Remove member from team

#### Task Assignment (Updated)
- `PUT /api/tasks/[id]` - Updated to support:
  - Assigning tasks to users via `assignedTo` field
  - Validation that assigned user is a team member (if task has teamId)
  - Automatic email notification when user is assigned
  - Storing assigned user's email and name for quick access

### 3. Email Notification System

#### Email Utility (`lib/email.js`) - **NEW**
- `sendTaskAssignmentEmail()` - Sends notification when user is assigned to a task
- `sendTeamInvitationEmail()` - Sends notification when user is added to a team
- Configurable SMTP settings via environment variables
- HTML and plain text email templates

### 4. Dependencies
- Installed `nodemailer` package for email functionality

---

## Key Features

### Team Management
1. **Create Teams**: Users can create teams and are automatically set as admin
2. **Add Members**: Admin/PO can add registered users to teams by email
3. **Role Assignment**: Members can have roles: admin, po, or member
4. **Member Tracking**: Each member has userId, email, name, role, and addedAt timestamp
5. **Email Notifications**: Users receive email when added to a team

### Task Assignment
1. **Assign to Team Members**: Tasks with teamId can only be assigned to team members
2. **Assign to Any User**: Tasks without teamId can be assigned to any registered user
3. **Validation**: System validates that assigned user exists and is team member (if applicable)
4. **Email Notifications**: Assigned users receive email with task details
5. **Reassignment**: Can reassign tasks to different users
6. **Unassignment**: Can remove assignment by setting assignedTo to null

### Email Notifications
1. **Task Assignment Email**:
   - Includes task title and description
   - Shows who assigned the task
   - Professional HTML formatting
   - Plain text fallback

2. **Team Invitation Email**:
   - Shows team name and role
   - Indicates who invited them
   - Professional formatting

### Authorization & Security
1. **Only Team Owners** can:
   - Add/remove members
   - Update team settings
   - Delete teams

2. **Only Task Creators** can:
   - Assign/reassign tasks
   - Update task details
   - Delete tasks

3. **Validation**:
   - Email validation
   - User existence checks
   - Team membership validation
   - Duplicate prevention

---

## Files Created

```
lib/models/Team.js                              - Team database model
lib/email.js                                    - Email utility functions
app/api/teams/route.js                          - Team CRUD endpoints
app/api/teams/[id]/route.js                     - Single team operations
app/api/teams/[id]/members/route.js             - Team member management
.env.example                                    - Environment variables template
API_DOCUMENTATION.md                            - Complete API documentation
IMPLEMENTATION_SUMMARY.md                       - This file
```

## Files Modified

```
lib/models/Task.js                              - Added assignment fields
app/api/tasks/[id]/route.js                     - Added assignment logic
package.json                                    - Added nodemailer dependency
```

---

## Configuration Required

### 1. Environment Variables
Add these to your `.env.local` file:

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

### 2. Gmail Setup (if using Gmail)
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password in `SMTP_PASSWORD` (not your regular password)

### 3. Alternative Email Providers
The system works with any SMTP provider:
- **SendGrid**: smtp.sendgrid.net (port 587)
- **Mailgun**: smtp.mailgun.org (port 587)
- **AWS SES**: email-smtp.{region}.amazonaws.com (port 587)
- **Outlook**: smtp-mail.outlook.com (port 587)

---

## Usage Flow

### 1. Team Creation & Management
```javascript
// Create a team
POST /api/teams
{ "name": "Development Team" }

// Add a member with 'po' role
POST /api/teams/{teamId}/members
{ "email": "user@example.com", "role": "po" }

// Add a regular member
POST /api/teams/{teamId}/members
{ "email": "dev@example.com", "role": "member" }
```

### 2. Task Assignment
```javascript
// Create a task with team
POST /api/tasks
{
  "title": "Implement feature",
  "description": "Details...",
  "teamId": "team_id",
  "priority": "high"
}

// Assign task to team member
PUT /api/tasks/{taskId}
{ "assignedTo": "user_id" }

// User receives email notification automatically
```

### 3. Email Notifications
- **Automatic**: Emails are sent automatically when:
  - A user is added to a team
  - A task is assigned to a user

- **Error Handling**: Email failures are logged but don't block the operation
  - Task assignment succeeds even if email fails
  - Member addition succeeds even if email fails

---

## Testing Checklist

### Team Management
- [ ] Create a team
- [ ] Verify creator is added as admin
- [ ] Add multiple members with different roles
- [ ] Try adding non-existent user (should fail)
- [ ] Try adding duplicate member (should fail)
- [ ] Update team name
- [ ] Delete team (verify tasks are updated)

### Task Assignment
- [ ] Create task with teamId
- [ ] Assign to team member (should succeed)
- [ ] Try assigning to non-member (should fail)
- [ ] Reassign to different member
- [ ] Unassign task (set to null)
- [ ] Create task without teamId
- [ ] Assign to any registered user (should succeed)

### Email Notifications
- [ ] Configure SMTP settings in .env.local
- [ ] Add member to team → check email
- [ ] Assign task to user → check email
- [ ] Verify email formatting (HTML and text)
- [ ] Check sender name and address
- [ ] Test with different email providers

### Authorization
- [ ] Non-owner cannot add members
- [ ] Non-owner cannot delete team
- [ ] Non-creator cannot assign task
- [ ] Cannot assign to non-team-member

---

## Database Schema Changes

### New Collections
```javascript
teams: {
  _id: ObjectId,
  name: String,
  userId: ObjectId,
  members: [{
    userId: ObjectId,
    email: String,
    name: String,
    role: String,
    addedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Updated Collections
```javascript
tasks: {
  // ... existing fields ...
  teamId: ObjectId,              // Changed from String
  assignedTo: ObjectId,          // NEW
  assignedToEmail: String,       // NEW
  assignedToName: String         // NEW
}
```

---

## Future Enhancements (Optional)

1. **UI Components**:
   - Team management interface
   - Task assignment dropdown
   - Member list with roles
   - Assignment history

2. **Advanced Features**:
   - Role-based permissions (admin/po specific actions)
   - Task comments and mentions
   - Due date reminders via email
   - Weekly task summary emails
   - Team activity feed

3. **Notifications**:
   - In-app notifications
   - Email preferences (opt-out)
   - Digest emails (daily/weekly)
   - Slack/Discord integration

4. **Team Features**:
   - Team analytics and metrics
   - Member activity tracking
   - Team templates
   - Bulk task assignment

---

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env.local`
2. Verify SMTP_HOST and SMTP_PORT are correct
3. For Gmail, ensure App Password is used (not regular password)
4. Check server logs for email errors
5. Test SMTP connection with a simple script

### Task Assignment Fails
1. Verify user exists in database
2. Check if task has teamId and user is member
3. Ensure ObjectId format is valid
4. Check server logs for validation errors

### Team Member Addition Fails
1. Verify user email exists in system (user must register first)
2. Check for duplicate members
3. Ensure team owner is making the request
4. Verify email format is valid

---

## API Integration Examples

### Frontend Integration (React/Next.js)

```javascript
// Add member to team
const addTeamMember = async (teamId, email, role) => {
  const response = await fetch(`/api/teams/${teamId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
};

// Assign task to user
const assignTask = async (taskId, userId) => {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assignedTo: userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
};
```

---

## Notes

- Email notifications are sent asynchronously and don't block the main operation
- Failed email sends are logged but don't cause the API request to fail
- Team owners cannot be removed from their own teams
- Tasks can be assigned without teams (will accept any registered user)
- All dates are stored in UTC
- Passwords are never included in API responses or emails

---

## Support

For issues or questions:
1. Check the API_DOCUMENTATION.md for endpoint details
2. Review server logs for error messages
3. Verify environment variables are set correctly
4. Test SMTP connection separately if emails aren't working
