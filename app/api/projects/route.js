import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/lib/models/Project';
import Team from '@/lib/models/Team';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    let query = { userId: session.user.id };

    if (teamId) {
      query.teamIds = teamId;
    }

    const projects = await Project.find(query).sort({ name: 1 });

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const { name, icon, teamIds } = await req.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const existingProject = await Project.findOne({
      userId: session.user.id,
      name: name.trim(),
    });

    if (existingProject) {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 409 }
      );
    }

    // Validate team IDs if provided
    if (teamIds && teamIds.length > 0) {
      const teams = await Team.find({
        _id: { $in: teamIds },
        userId: session.user.id,
      });

      if (teams.length !== teamIds.length) {
        return NextResponse.json(
          { error: 'One or more teams not found or not owned by user' },
          { status: 400 }
        );
      }
    }

    const project = await Project.create({
      name: name.trim(),
      icon: icon || '',
      teamIds: teamIds || [],
      userId: session.user.id,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
