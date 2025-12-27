
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/lib/models/Project';
import Team from '@/lib/models/Team';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {

import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/lib/models/Project';
import Team from '@/lib/models/Team';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

function serializeProject(doc) {
  const project = doc.toObject({ virtuals: false });
  return {
    ...project,
    _id: project._id.toString(),
    userId: project.userId.toString(),
    teamIds: (project.teamIds || []).map((id) => id.toString()),
    createdAt: project.createdAt?.toISOString?.() || project.createdAt,
    updatedAt: project.updatedAt?.toISOString?.() || project.updatedAt,
  };
}

async function resolveTeamIds(teamIds, userId) {
  if (!Array.isArray(teamIds) || teamIds.length === 0) return [];
  const validIds = [...new Set(teamIds.filter((id) => mongoose.Types.ObjectId.isValid(id)))];
  if (validIds.length === 0) return [];
  const teams = await Team.find({ _id: { $in: validIds }, userId });
  return teams.map((team) => team._id);
}

export async function GET(request) {

  try {
    const session = await requireAuth();
    await dbConnect();


    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    let query = { userId: session.user.id };

    if (teamId) {

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    const query = { userId: session.user.id };
    if (teamId && mongoose.Types.ObjectId.isValid(teamId)) {

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
    return NextResponse.json({ projects: projects.map(serializeProject) }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { name, icon = '', teamIds = [] } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    await dbConnect();

    const resolvedTeamIds = await resolveTeamIds(teamIds, session.user.id);

    const project = await Project.create({
      name: name.trim(),
      icon,
      teamIds: resolvedTeamIds,
      userId: session.user.id,
    });

    return NextResponse.json({ project: serializeProject(project) }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Project name already exists' }, { status: 409 });
    }
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
