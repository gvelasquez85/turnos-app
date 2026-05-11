import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, brand_id, source, lead_form_id, custom_fields } = body

    // Validation
    if (!name || !email || !brand_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, brand_id' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = supabaseAdmin()
    const canalContacto = source || 'web'

    // Check for existing customer by email + brand_id
    const { data: existing, error: lookupError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .eq('brand_id', brand_id)
      .maybeSingle()

    if (lookupError) {
      console.error('Lead API lookup error:', lookupError)
      return NextResponse.json(
        { error: 'Server error' },
        { status: 500, headers: corsHeaders }
      )
    }

    const record: Record<string, unknown> = {
      name,
      email,
      brand_id,
      canal_contacto: canalContacto,
    }

    if (phone) {
      record.phone = phone
      record.celular = phone
    }

    // Try to set lead_source; column may not exist yet
    record.lead_source = source || 'web'

    // lead_form_id and custom_fields are logged but not stored on customers table
    if (lead_form_id || custom_fields) {
      console.log('Lead form submission:', { lead_form_id, custom_fields })
    }

    if (existing) {
      // Update existing customer
      const { data, error } = await supabase
        .from('customers')
        .update(record)
        .eq('id', existing.id)
        .select('id')
        .single()

      if (error) {
        // If lead_source column doesn't exist, retry without it
        if (error.message?.includes('lead_source')) {
          delete record.lead_source
          const { data: retryData, error: retryError } = await supabase
            .from('customers')
            .update(record)
            .eq('id', existing.id)
            .select('id')
            .single()

          if (retryError) {
            console.error('Lead API update error:', retryError)
            return NextResponse.json(
              { error: 'Server error' },
              { status: 500, headers: corsHeaders }
            )
          }

          return NextResponse.json(
            { id: retryData.id, status: 'updated' },
            { status: 200, headers: corsHeaders }
          )
        }

        console.error('Lead API update error:', error)
        return NextResponse.json(
          { error: 'Server error' },
          { status: 500, headers: corsHeaders }
        )
      }

      return NextResponse.json(
        { id: data.id, status: 'updated' },
        { status: 200, headers: corsHeaders }
      )
    } else {
      // Insert new customer
      const { data, error } = await supabase
        .from('customers')
        .insert(record)
        .select('id')
        .single()

      if (error) {
        // If lead_source column doesn't exist, retry without it
        if (error.message?.includes('lead_source')) {
          delete record.lead_source
          const { data: retryData, error: retryError } = await supabase
            .from('customers')
            .insert(record)
            .select('id')
            .single()

          if (retryError) {
            console.error('Lead API insert error:', retryError)
            return NextResponse.json(
              { error: 'Server error' },
              { status: 500, headers: corsHeaders }
            )
          }

          return NextResponse.json(
            { id: retryData.id, status: 'created' },
            { status: 201, headers: corsHeaders }
          )
        }

        console.error('Lead API insert error:', error)
        return NextResponse.json(
          { error: 'Server error' },
          { status: 500, headers: corsHeaders }
        )
      }

      return NextResponse.json(
        { id: data.id, status: 'created' },
        { status: 201, headers: corsHeaders }
      )
    }
  } catch (err) {
    console.error('Lead API error:', err)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers: corsHeaders }
    )
  }
}
