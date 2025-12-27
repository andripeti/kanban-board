import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Team from '@/lib/models/Team';
import User from '@/lib/models/User';
import { requireAuth } from '@/lib/auth';
import { sendTeamInvitationEmail } from '@/lib/email';
import mongoose from 'mongoose';

export async function POST(req, { params }) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const { id } = params;
    const { email, role } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    const validRoles = ['admin', 'po', 'member'];
    const memberRole = role && validRoles.includes(role) ? role : 'member';

    const team = await Team.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found or you do not have permission to manage it' },
        { status: 404 }
      );
    }

    const userToAdd = await User.findOne({ email: email.trim().toLowerCase() });

    if (!userToAdd) {
      return NextResponse.json(
        { error: 'User with this email does not exist in the system' },
        { status: 404 }
      );
    }

    const isAlreadyMember = team.members.some(
      member => member.userId.toString() === userToAdd._id.toString()
    );

    if (isAlreadyMember) {
      return NextResponse.json(
        { error: 'User is already a member of this team' },
        { status: 409 }
      );
    }

    team.members.push({
      userId: userToAdd._id,
      email: userToAdd.email,
      name: userToAdd.name,
      role: memberRole,
    });

    await team.save();

    try {
      await sendTeamInvitationEmail({
        to: userToAdd.email,
        toName: userToAdd.name,
        teamName: team.name,
        invitedBy: session.user.name,
        role: memberRole,
      });
    } catch (emailError) {
      console.error('Failed to send team invitation email:', emailError);
    }

    return NextResponse.json(
      {
        message: 'User added to team successfully',
        team,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error adding member to team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add member to team' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const memberUserId = searchParams.get('userId');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid team ID' },
        { status: 400 }
      );
    }

    if (!memberUserId || !mongoose.Types.ObjectId.isValid(memberUserId)) {
      return NextResponse.json(
        { error: 'Valid member user ID is required' },
        { status: 400 }
      );
    }

    const team = await Team.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found or you do not have permission to manage it' },
        { status: 404 }
      );
    }

    if (memberUserId === session.user.id) {
      return NextResponse.json(
        { error: 'Team owner cannot be removed from the team' },
        { status: 400 }
      );
    }

    const memberIndex = team.members.findIndex(
      member => member.userId.toString() === memberUserId
    );

    if (memberIndex === -1) {
      return NextResponse.json(
        { error: 'User is not a member of this team' },
        { status: 404 }
      );
    }

    team.members.splice(memberIndex, 1);
    await team.save();

    return NextResponse.json(
      {
        message: 'Member removed from team successfully',
        team,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing member from team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove member from team' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
