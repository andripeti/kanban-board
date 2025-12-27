import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

export const sendTaskAssignmentEmail = async ({ to, toName, taskTitle, taskDescription, assignedBy }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Kanban Board'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject: `You've been assigned to a task: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Task Assignment</h2>
          <p>Hi ${toName},</p>
          <p>You have been assigned to a new task by <strong>${assignedBy}</strong>.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">${taskTitle}</h3>
            ${taskDescription ? `<p style="color: #666;">${taskDescription}</p>` : ''}
          </div>

          <p>Please log in to the Kanban Board to view more details and start working on this task.</p>

          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            This is an automated email from your Kanban Board application.
          </p>
        </div>
      `,
      text: `
Hi ${toName},

You have been assigned to a new task by ${assignedBy}.

Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}

Please log in to the Kanban Board to view more details and start working on this task.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export const sendTeamInvitationEmail = async ({ to, toName, teamName, invitedBy, role }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Kanban Board'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject: `You've been added to team: ${teamName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Team Invitation</h2>
          <p>Hi ${toName},</p>
          <p>You have been added to the team <strong>${teamName}</strong> by <strong>${invitedBy}</strong>.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Team:</strong> ${teamName}</p>
            <p><strong>Your Role:</strong> ${role.toUpperCase()}</p>
          </div>

          <p>Please log in to the Kanban Board to start collaborating with your team.</p>

          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            This is an automated email from your Kanban Board application.
          </p>
        </div>
      `,
      text: `
Hi ${toName},

You have been added to the team ${teamName} by ${invitedBy}.

Team: ${teamName}
Your Role: ${role.toUpperCase()}

Please log in to the Kanban Board to start collaborating with your team.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Team invitation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending team invitation email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
