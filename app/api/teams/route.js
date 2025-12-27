import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Team from '@/lib/models/Team';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const teams = await Team.find({ userId: session.user.id }).sort({ name: 1 });

    return NextResponse.json({ teams }, { status: 200 });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch teams' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const { name } = await req.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const existingTeam = await Team.findOne({
      userId: session.user.id,
      name: name.trim(),
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: 'A team with this name already exists' },
        { status: 409 }
      );
    }

    const team = await Team.create({
      name: name.trim(),
      userId: session.user.id,
      members: [{
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: 'admin',
      }],
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create team' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
