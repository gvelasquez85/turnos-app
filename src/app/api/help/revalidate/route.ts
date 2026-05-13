import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST() {
  revalidateTag('help-articles', 'default')
  return NextResponse.json({ revalidated: true, now: Date.now() })
}
