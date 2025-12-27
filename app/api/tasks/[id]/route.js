import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import User from '@/lib/models/User';
import Team from '@/lib/models/Team';
import { requireAuth } from '@/lib/auth';
import { sendTaskAssignmentEmail } from '@/lib/email';
import mongoose from 'mongoose';

// GET single task
export async function GET(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    await dbConnect();

    const task = await Task.findOne({ _id: id, userId: session.user.id });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT update task
export async function PUT(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    await dbConnect();

    const task = await Task.findOne({ _id: id, userId: session.user.id });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const previousAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;

    const allowedFields = ['title', 'description', 'status', 'priority', 'scheduled', 'teamId', 'assignedTo'];
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        task[field] = body[field];
      }
    });

    if (body.assignedTo && mongoose.Types.ObjectId.isValid(body.assignedTo)) {
      const newAssignedTo = body.assignedTo.toString();

      if (newAssignedTo !== previousAssignedTo) {
        if (task.teamId) {
          const team = await Team.findById(task.teamId);

          if (team) {
            const isMember = team.members.some(
              member => member.userId.toString() === newAssignedTo
            );

            if (!isMember) {
              return NextResponse.json(
                { error: 'Cannot assign task to user who is not a team member' },
                { status: 400 }
              );
            }

            const memberInfo = team.members.find(
              member => member.userId.toString() === newAssignedTo
            );

            if (memberInfo) {
              task.assignedToEmail = memberInfo.email;
              task.assignedToName = memberInfo.name;
            }
          }
        } else {
          const assignedUser = await User.findById(newAssignedTo);

          if (!assignedUser) {
            return NextResponse.json(
              { error: 'Assigned user not found' },
              { status: 404 }
            );
          }

          task.assignedToEmail = assignedUser.email;
          task.assignedToName = assignedUser.name;
        }

        await task.save();

        try {
          await sendTaskAssignmentEmail({
            to: task.assignedToEmail,
            toName: task.assignedToName,
            taskTitle: task.title,
            taskDescription: task.description,
            assignedBy: session.user.name,
          });
        } catch (emailError) {
          console.error('Failed to send task assignment email:', emailError);
        }
      }
    } else if (body.assignedTo === null) {
      task.assignedTo = null;
      task.assignedToEmail = null;
      task.assignedToName = null;
      await task.save();
    } else {
      await task.save();
    }

    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE task
export async function DELETE(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    await dbConnect();

    const task = await Task.findOneAndDelete({ _id: id, userId: session.user.id });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}