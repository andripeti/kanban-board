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
