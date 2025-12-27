import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Team from '@/lib/models/Team';
import Task from '@/lib/models/Task';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    const team = await Team.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ team }, { status: 200 });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch team' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const { id } = params;
    const { name } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const team = await Team.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const existingTeam = await Team.findOne({
      userId: session.user.id,
      name: name.trim(),
      _id: { $ne: id },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: 'A team with this name already exists' },
        { status: 409 }
      );
    }

    team.name = name.trim();
    await team.save();

    return NextResponse.json({ team }, { status: 200 });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update team' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    const team = await Team.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    await Task.updateMany(
      { teamId: id },
      { $set: { teamId: null } }
    );

    await Team.deleteOne({ _id: id });

    return NextResponse.json(
      { message: 'Team deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete team' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
import { requireAuth } from '@/lib/auth';
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
    createdAt: team.createdAt?.toISOString?.() || team.createdAt,
    updatedAt: team.updatedAt?.toISOString?.() || team.updatedAt,
  };
}

async function findTeamOr404(id, userId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: 'Invalid team ID', status: 400 };
  }
  await dbConnect();
  const team = await Team.findOne({ _id: id, userId });
  if (!team) {
    return { error: 'Team not found', status: 404 };
  }
  return { team };
}

export async function GET(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const result = await findTeamOr404(id, session.user.id);
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

    const result = await findTeamOr404(id, session.user.id);
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

    const result = await findTeamOr404(id, session.user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await Project.updateMany(
      { userId: session.user.id },
      { $pull: { teamIds: result.team._id } }
    );
    await Task.updateMany(
      { userId: session.user.id, teamId: result.team._id },
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
