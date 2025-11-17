import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import dbConnect from '../../../../lib/db'
import Task from '../../../../lib/models/Task'

export async function PUT(request, { params }){
  try{
    await dbConnect()
    const { id } = params
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
    const body = await request.json()
    const allowed = ['title','description','status','priority']
    const update = {}
    for (const key of allowed){
      if (body[key] !== undefined) update[key] = body[key]
    }
    if (update.title && typeof update.title === 'string') update.title = update.title.trim()

    const task = await Task.findByIdAndUpdate(id, update, { new: true })
    if (!task) return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    return NextResponse.json(task)
  }catch(err){
    console.error(err)
    return NextResponse.json({ message: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(request, { params }){
  try{
    await dbConnect()
    const { id } = params
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
    const task = await Task.findByIdAndDelete(id)
    if (!task) return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    return NextResponse.json({ message: 'Deleted' })
  }catch(err){
    console.error(err)
    return NextResponse.json({ message: 'Failed to delete task' }, { status: 500 })
  }
}
