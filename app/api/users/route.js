import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await requireAuth();
    await dbConnect();

    const users = await User.find({}, 'name email createdAt').sort({ name: 1 });
    
    const serializedUsers = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt?.toISOString?.() || user.createdAt,
    }));

    return NextResponse.json({ users: serializedUsers }, { status: 200 });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
