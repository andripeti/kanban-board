import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/lib/models/Project';
import Team from '@/lib/models/Team';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const project = await Project.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const { id } = params;
    const { name, icon, teamIds } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const project = await Project.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: 'Project name cannot be empty' },
          { status: 400 }
        );
      }

      const existingProject = await Project.findOne({
        userId: session.user.id,
        name: name.trim(),
        _id: { $ne: id },
      });

      if (existingProject) {
        return NextResponse.json(
          { error: 'A project with this name already exists' },
          { status: 409 }
        );
      }

      project.name = name.trim();
    }

    if (icon !== undefined) {
      project.icon = icon;
    }

    if (teamIds !== undefined) {
      // Validate team IDs
      if (teamIds.length > 0) {
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

      project.teamIds = teamIds;
    }

    await project.save();

    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update project' },
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
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const project = await Project.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    await Project.deleteOne({ _id: id });

    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
