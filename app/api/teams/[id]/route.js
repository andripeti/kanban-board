import { requireAuth, isTeamAdmin, canViewTeam } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/lib/models/Project';
import Task from '@/lib/models/Task';
import Team from '@/lib/models/Team';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

function serializeTeam(doc) {
  const team = doc.toObject({ virtuals: false });
  return {
    ...team,
    _id: team._id.toString(),
    userId: team.userId.toString(),
    members: team.members?.map((m) => ({
      userId: m.userId?._id?.toString() || m.userId?.toString() || m.userId,
      name: m.userId?.name,
      email: m.userId?.email,
      role: m.role || 'member',
      addedAt: m.addedAt?.toISOString?.() || m.addedAt,
    })) || [],
    createdAt: team.createdAt?.toISOString?.() || team.createdAt,
    updatedAt: team.updatedAt?.toISOString?.() || team.updatedAt,
  };
}

async function findTeamAndCheckAccess(id, userId, requireAdmin = false) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: 'Invalid team ID', status: 400 };
  }
  await dbConnect();
  const team = await Team.findById(id).populate('members.userId', 'name email');
  if (!team) {
    return { error: 'Team not found', status: 404 };
  }
  
  const canView = await canViewTeam(userId, id);
  if (!canView) {
    return { error: 'You do not have access to this team', status: 403 };
  }
  
  if (requireAdmin) {
    const isAdmin = await isTeamAdmin(userId, id);
    if (!isAdmin) {
      return { error: 'Only team admins can perform this action', status: 403 };
    }
  }
  
  return { team };
}

export async function GET(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const result = await findTeamAndCheckAccess(id, session.user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ team: serializeTeam(result.team) }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const body = await request.json();
    const { name } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const result = await findTeamAndCheckAccess(id, session.user.id, true);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    result.team.name = name.trim();
    await result.team.save();

    return NextResponse.json({ team: serializeTeam(result.team) }, { status: 200 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Team name already exists' }, { status: 409 });
    }
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;

    const result = await findTeamAndCheckAccess(id, session.user.id, true);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await Project.updateMany(
      { teamIds: result.team._id },
      { $pull: { teamIds: result.team._id } }
    );
    await Task.updateMany(
      { teamId: result.team._id },
      { $set: { teamId: null } }
    );

    await result.team.deleteOne();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}