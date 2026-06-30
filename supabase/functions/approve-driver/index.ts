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
    console.log('Received request');
    let body;
    try {
      body = await req.json();
      console.log('Parsed JSON:', body);
    } catch (e) {
      throw new Error('Invalid request body: ' + e.message);
    }

    const { applicationId, approvedBy } = body;
    if (!applicationId) throw new Error('applicationId is required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Edge environment');
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    console.log('Fetched application:', applicationId);
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('driver_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !app) {
      throw new Error(`Application not found: ${fetchError?.message || 'Unknown'}`);
    }

    if (app.application_status !== 'pending') {
      throw new Error(`Application already processed (${app.application_status})`);
    }

    const tempPassword = generatePassword();
    const year = new Date().getFullYear();
    const { count, error: countError } = await supabaseAdmin
      .from('drivers')
      .select('id', { count: 'exact', head: true });
      
    if (countError) throw new Error(`Error counting drivers: ${countError.message}`);
    
    const driverCode = `MCD-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`;

    console.log('Created auth user for:', app.email);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: app.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: 'driver', full_name: app.full_name }
    });

    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message || JSON.stringify(authError)}`);
    }
    if (!authData || !authData.user) {
      throw new Error(`Auth creation returned no user`);
    }

    const authUserId = authData.user.id;
    
    console.log('Inserted driver via RPC. auth_user_id:', authUserId);
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('approve_driver_application', {
      p_application_id: applicationId,
      p_auth_user_id: authUserId,
      p_generated_code: driverCode,
      p_approved_by: approvedBy || 'Officer'
    });

    if (rpcError) {
      console.log('Rolling back Auth user due to RPC error...');
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      throw new Error(`Database error during approval: ${rpcError.message}`);
    }

    console.log('Updated application successfully');
    console.log('Returning success');

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
    });

  } catch (err) {
    console.error('Edge Function Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
        stack: err.stack
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
})

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
