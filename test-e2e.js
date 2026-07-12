import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Log all console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  // Log all Supabase API responses
  page.on('response', async (res) => {
    if (res.url().includes('supabase.co')) {
      console.log(`API RESPONSE [${res.status()}] ${res.url()}`);
      try {
        const text = await res.text();
        console.log('BODY:', text);
      } catch (e) {}
    }
  });

  console.log('Navigating to production URL...');
  await page.goto('https://suds-portal.vercel.app/apply', { waitUntil: 'networkidle0' });

  console.log('Filling form...');
  
  // Step 1: Personal Info
  await page.type('input[placeholder="Rajesh Kumar"]', 'Puppeteer Test');
  await page.type('input[type="email"]', 'puppeteer@test.com');
  await page.type('input[type="tel"]', '1234567890');
  await page.type('textarea', '123 Puppeteer St');
  
  // Click Next
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find(b => b.textContent.includes('Next'));
    if (nextBtn) nextBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));

  // Step 2: Licence & Vehicle
  await page.type('input[placeholder="1234 5678 9012"]', '123456789012');
  await page.type('input[placeholder="DL-XXXXXXXXXX"]', 'DL-1234567890');
  await page.type('input[type="date"]', '01012030');
  
  // Click Next
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find(b => b.textContent.includes('Next'));
    if (nextBtn) nextBtn.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  // Step 3: Documents
  // For tests, maybe we don't upload real files or we upload empty blobs
  console.log('Attaching files...');
  const fileInputs = await page.$$('input[type="file"]');
  
  // Create a dummy file
  const fs = await import('fs');
  fs.writeFileSync('dummy.pdf', 'dummy content');
  
  for (const input of fileInputs) {
    await input.uploadFile('dummy.pdf');
    await new Promise(r => setTimeout(r, 500));
  }

  // Click Next
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find(b => b.textContent.includes('Next'));
    if (nextBtn) nextBtn.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  console.log('Clicking Submit Application...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.textContent.includes('Submit Application'));
    if (submitBtn) submitBtn.click();
  });

  console.log('Waiting for network/response...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('Done.');
  await browser.close();
  fs.unlinkSync('dummy.pdf');
})();
