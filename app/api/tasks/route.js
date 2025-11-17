import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/db'
import Task from '../../../lib/models/Task'

export async function GET(request){
  try{
    await dbConnect()
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')
    const filter = {}
    if (status) filter.status = status
    if (priority) filter.priority = priority

    const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean()
    return NextResponse.json(tasks)
  }catch(err){
    console.error(err)
    return NextResponse.json({ message: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request){
  try{
    await dbConnect()
    const body = await request.json()
    if (!body || !body.title || typeof body.title !== 'string' || body.title.trim() === ''){
      return NextResponse.json({ message: 'Title is required' }, { status: 400 })
    }

    const payload = {
      title: body.title.trim(),
      description: body.description || '',
      priority: ['low','medium','high'].includes(body.priority) ? body.priority : 'medium',
      status: ['todo','in-progress','done'].includes(body.status) ? body.status : 'todo'
    }

    const task = await Task.create(payload)
    return NextResponse.json(task, { status: 201 })
  }catch(err){
    console.error(err)
    return NextResponse.json({ message: 'Failed to create task' }, { status: 500 })
  }
}
