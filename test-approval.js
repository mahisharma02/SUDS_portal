import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import fs from 'fs'

const url = 'https://ayucatrmlenxbojnrnde.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5dWNhdHJtbGVueGJvam5ybmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzY3NDUsImV4cCI6MjA5NzYxMjc0NX0.y7oc8gGSHCSyE0AGF707HwkNJ6Ol66Ki5nF0-902u1k';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

const supabaseAnon = createClient(url, anonKey);

async function testWorkflow() {
  console.log('--- STARTING END-TO-END APPROVAL WORKFLOW TEST ---');
  
  // 0. Login as Officer
  console.log('⏳ Logging in as Officer...');
  const { data: officerLogin, error: officerError } = await supabaseAnon.auth.signInWithPassword({
    email: 'officer@municipal.gov.in',
    password: 'Password123!'
  });
  if (officerError) {
    console.error('❌ FAIL: Officer login failed!', officerError);
    return;
  }
  const officerJwt = officerLogin.session.access_token;
  console.log('✅ Officer logged in successfully.');

  // 1. Submit Application
  const applicationId = crypto.randomUUID();
  const payload = {
    id: applicationId,
    full_name: 'Jane Doe',
    email: `jane_${Date.now()}@test.com`,
    phone: '5551234567',
    address: '456 Test Blvd',
    aadhaar_number: '123456781234',
    licence_number: 'DL-JANE-567',
    licence_expiry: '2030-01-01',
    vehicle_type: 'Auto/Mini Truck',
    years_experience: 3
  };
  
  const { error: insertError } = await supabaseAnon.from('driver_applications').insert(payload);
  if (insertError) {
    console.error('❌ FAIL: Insert Failed!', insertError);
    return;
  }
  console.log(`✅ Application Inserted (ID: ${applicationId})`);

  // 2. Invoke approve-driver Edge Function as Officer
  console.log('⏳ Invoking approve-driver edge function...');
  const officerClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${officerJwt}` } }
  });
  
  const { data, error } = await officerClient.functions.invoke('approve-driver', {
    body: { applicationId, approvedBy: 'Test Officer' }
  });

  if (error) {
    if (error.context && typeof error.context.text === 'function') {
      const text = await error.context.text();
      console.error('❌ FAIL: Edge Function Error! Body:', text);
    } else {
      console.error('❌ FAIL: Edge Function Error!', error);
    }
    return;
  }
  
  if (!data || !data.success) {
    console.error('❌ FAIL: Edge Function returned failure!', data);
    return;
  }
  
  console.log('✅ APPROVAL SUCCESS!');
  console.log('Credentials returned:');
  console.log(data);

  // 3. We cannot query drivers easily with anon key due to RLS,
  // but if the function returned success, the driver is in the database!
  // Let's attempt to log in as the newly created driver!
  console.log('⏳ Attempting to login as the new driver...');
  const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
    email: data.email,
    password: data.tempPassword
  });

  if (loginError) {
    console.error('❌ FAIL: Could not login with new credentials!', loginError);
    return;
  }

  console.log('✅ LOGIN SUCCESS!');
  console.log(`User ID: ${loginData.user.id}`);
  console.log(`User Metadata:`, loginData.user.user_metadata);
  console.log(`App Metadata:`, loginData.user.app_metadata);
  
  // 4. Now that we are logged in as the driver, we CAN query the drivers table for our own record!
  const driverClient = createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${loginData.session.access_token}` }
    }
  });

  const { data: driverData, error: driverError } = await driverClient
    .from('drivers')
    .select('*')
    .eq('auth_user_id', loginData.user.id)
    .single();

  if (driverError) {
    console.error('❌ FAIL: Could not fetch driver record!', driverError);
    return;
  }

  console.log('✅ Driver Record Verified in Database:');
  console.log(driverData);

  const { data: statsData, error: statsError } = await driverClient
    .from('driver_monthly_stats')
    .select('*')
    .eq('driver_id', driverData.id);

  if (statsError) {
    console.error('❌ FAIL: Could not fetch stats record!', statsError);
    return;
  }
  console.log('✅ Driver Monthly Stats Verified in Database:');
  console.log(statsData);

  console.log('--- ALL TESTS PASSED ---');
}

testWorkflow();
