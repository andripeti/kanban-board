import { requireAuth, canEditInTeam } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/lib/models/Project';
import Task from '@/lib/models/Task';
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

async function resolveTeamIds(teamIds) {
  if (!Array.isArray(teamIds) || teamIds.length === 0) return [];
  const validIds = [...new Set(teamIds.filter((id) => mongoose.Types.ObjectId.isValid(id)))];
  if (validIds.length === 0) return [];
  const teams = await Team.find({ _id: { $in: validIds } });
  return teams.map((team) => team._id);
}

async function findProjectAndCheckAccess(id, userId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: 'Invalid project ID', status: 400 };
  }
  await dbConnect();
  const project = await Project.findById(id);
  if (!project) {
    return { error: 'Project not found', status: 404 };
  }
  
  const isOwner = project.userId.toString() === userId;
  
  let hasTeamAccess = false;
  if (project.teamIds && project.teamIds.length > 0) {
    for (const teamId of project.teamIds) {
      if (await canEditInTeam(userId, teamId)) {
        hasTeamAccess = true;
        break;
      }
    }
  }
  
  if (!isOwner && !hasTeamAccess) {
    return { error: 'You do not have permission to access this project', status: 403 };
  }
  
  return { project, isOwner, hasTeamAccess };
}

export async function GET(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const result = await findProjectAndCheckAccess(id, session.user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ project: serializeProject(result.project) }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const body = await request.json();
    const { name, icon, teamIds } = body;

    const result = await findProjectAndCheckAccess(id, session.user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
      }
      result.project.name = name.trim();
    }

    if (icon !== undefined) {
      result.project.icon = icon;
    }

    if (teamIds !== undefined) {
      for (const teamId of teamIds) {
        if (mongoose.Types.ObjectId.isValid(teamId)) {
          const hasPermission = await canEditInTeam(session.user.id, teamId);
          if (!hasPermission) {
            return NextResponse.json(
              { error: 'You do not have edit access to one of the selected teams' },
              { status: 403 }
            );
          }
        }
      }
      
      const resolved = await resolveTeamIds(teamIds);
      result.project.teamIds = resolved;

      if (resolved.length > 0) {
        await Task.updateMany(
          {
            projectId: result.project._id,
            teamId: { $nin: resolved },
          },
          { $set: { teamId: null } }
        );
      }
    }

    await result.project.save();

    return NextResponse.json({ project: serializeProject(result.project) }, { status: 200 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Project name already exists' }, { status: 409 });
    }
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await requireAuth();
    const { id } = params;
    const result = await findProjectAndCheckAccess(id, session.user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await Task.updateMany(
      { projectId: result.project._id },
      { $set: { projectId: null } }
    );

    await result.project.deleteOne();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}