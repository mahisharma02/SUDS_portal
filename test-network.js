const url = 'https://ayucatrmlenxbojnrnde.supabase.co/rest/v1/driver_applications?select=id';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5dWNhdHJtbGVueGJvam5ybmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzY3NDUsImV4cCI6MjA5NzYxMjc0NX0.y7oc8gGSHCSyE0AGF707HwkNJ6Ol66Ki5nF0-902u1k';

const payload = {
  full_name: 'Test Applicant',
  email: 'test@applicant.com',
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

const reqHeaders = {
  'apikey': anonKey,
  'Authorization': `Bearer ${anonKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

async function testSubmit() {
  console.log('\n=============================================');
  console.log('1. REQUEST HEADERS');
  console.log('=============================================');
  console.log(JSON.stringify({
    apikey: reqHeaders.apikey.substring(0,20) + '...',
    Authorization: reqHeaders.Authorization.substring(0,30) + '...',
    'Content-Type': reqHeaders['Content-Type'],
    'Prefer': reqHeaders['Prefer']
  }, null, 2));

  console.log('\n=============================================');
  console.log('2. REQUEST BODY');
  console.log('=============================================');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify(payload)
    });

    console.log('\n=============================================');
    console.log('3. RESPONSE STATUS');
    console.log('=============================================');
    console.log(`${res.status} ${res.statusText}`);

    console.log('\n=============================================');
    console.log('4. RESPONSE HEADERS');
    console.log('=============================================');
    res.headers.forEach((value, name) => {
      console.log(`${name}: ${value}`);
    });

    console.log('\n=============================================');
    console.log('5. RESPONSE BODY & 6. SUPABASE ERROR OBJECT');
    console.log('=============================================');
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw text response:', text);
    }

  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

testSubmit();
