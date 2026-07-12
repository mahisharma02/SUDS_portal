import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'get_officer') {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      const officer = data.users.find(u => u.email === 'officer@municipal.gov.in');
      return new Response(JSON.stringify({ officer }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    
    if (action === 'get_driver') {
      const email = body.email;
      const { data: users, error: uError } = await supabaseAdmin.auth.admin.listUsers();
      if (uError) throw uError;
      const driverAuth = users.users.find(u => u.email === email);
      
      const { data: driverRow, error: dError } = await supabaseAdmin
        .from('drivers')
        .select('*')
        .eq('email', email)
        .single();
        
      return new Response(JSON.stringify({ driverAuth, driverRow }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    
    if (action === 'create_officer') {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: 'officer@municipal.gov.in',
        password: 'Password123!',
        email_confirm: true,
        user_metadata: { role: 'officer', full_name: 'MCD Officer' }
      });
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'invalid action' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
