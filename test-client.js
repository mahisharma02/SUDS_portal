import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const url = 'https://ayucatrmlenxbojnrnde.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5dWNhdHJtbGVueGJvam5ybmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzY3NDUsImV4cCI6MjA5NzYxMjc0NX0.y7oc8gGSHCSyE0AGF707HwkNJ6Ol66Ki5nF0-902u1k';

// Enable fetch logging
const customFetch = async (url, options) => {
  console.log('--- FETCH INTERCEPT ---')
  console.log('URL:', url)
  console.log('Method:', options.method)
  console.log('Headers:', JSON.stringify(options.headers, null, 2))
  const res = await fetch(url, options)
  console.log('Response Status:', res.status)
  return res
}

const supabase = createClient(url, key, {
  global: { fetch: customFetch }
})

const payload = {
  id: crypto.randomUUID(),
  full_name: 'Test Supabase JS',
  email: 'testjs@applicant.com',
  phone: '9876543210',
  address: '123 Test St',
  aadhaar_number: '123456789012',
  licence_number: 'DL-1234567',
  licence_expiry: '2030-01-01',
  vehicle_type: 'Auto/Mini Truck',
  years_experience: 2,
  emergency_contact_name: 'Emergency',
  emergency_contact_phone: '1234567890',
  photo_url: null,
  aadhaar_url: null,
  licence_url: null,
  police_verification_url: null,
  address_proof_url: null
};

async function test() {
  console.log('Testing insert WITHOUT .select()...')
  const { data, error } = await supabase.from('driver_applications').insert(payload)
  
  if (error) {
    console.error('ERROR OCCURRED:')
    console.error(error)
  } else {
    console.log('SUCCESS!')
    console.log('Data returned:', data)
  }
}

test()
