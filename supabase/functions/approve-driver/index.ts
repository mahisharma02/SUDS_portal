// Supabase Edge Function: approve-driver
// Deploy via: supabase functions deploy approve-driver
// Requires SUPABASE_SERVICE_ROLE_KEY in environment secrets

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { applicationId, approvedBy } = await req.json()

    if (!applicationId) {
      return new Response(JSON.stringify({ error: 'applicationId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Fetch application
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('driver_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (fetchError || !app) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (app.application_status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Application already processed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate temporary password
    const tempPassword = generatePassword()

    // Generate driver code: MCD-YYYY-XXXX
    const year = new Date().getFullYear()
    const { count } = await supabaseAdmin
      .from('drivers')
      .select('id', { count: 'exact', head: true })
    const driverCode = `MCD-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: app.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: 'driver', full_name: app.full_name }
    })

    if (authError) {
      return new Response(JSON.stringify({ error: `Auth creation failed: ${authError.message}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const authUserId = authData.user.id

    // Call the SQL RPC to insert driver + update application
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('approve_driver_application', {
      p_application_id: applicationId,
      p_auth_user_id: authUserId,
      p_generated_code: driverCode,
      p_approved_by: approvedBy || 'Officer'
    })

    if (rpcError) {
      // Rollback: delete the auth user we just created
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
      return new Response(JSON.stringify({ error: `DB error: ${rpcError.message}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      driverCode,
      email: app.email,
      tempPassword,
      driverId: rpcResult?.driver_id,
      fullName: app.full_name
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
