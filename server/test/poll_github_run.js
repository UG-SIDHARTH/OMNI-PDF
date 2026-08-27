import https from 'https';

function fetchGitHub(urlPath) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: urlPath,
      method: 'GET',
      headers: {
        'User-Agent': 'OmniPDF-Release-Monitor'
      }
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(body); } catch (e) {}
        resolve({ status: res.statusCode, json });
      });
    });
    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function trackRun() {
  const runId = '33051014424';
  console.log(`Tracking GitHub Actions Run: https://github.com/UG-SIDHARTH/OMNI-PDF/actions/runs/${runId}\n`);

  let completed = false;
  let attempts = 0;

  while (!completed && attempts < 60) {
    attempts++;
    const res = await fetchGitHub(`/repos/UG-SIDHARTH/OMNI-PDF/actions/runs/${runId}`);
    if (res.status === 200 && res.json) {
      const r = res.json;
      console.log(`[Attempt ${attempts}] Status: ${r.status} | Conclusion: ${r.conclusion || 'pending'}`);
      
      const jobsRes = await fetchGitHub(`/repos/UG-SIDHARTH/OMNI-PDF/actions/runs/${runId}/jobs`);
      if (jobsRes.status === 200 && jobsRes.json.jobs) {
        jobsRes.json.jobs.forEach(j => {
          console.log(`  - Job: ${j.name.padEnd(40)} | Status: ${j.status} | Conclusion: ${j.conclusion || 'running'}`);
        });
      }

      if (r.status === 'completed') {
        completed = true;
        console.log(`\n🎉 Workflow Completed with conclusion: ${r.conclusion}`);
        break;
      }
    }
    await sleep(15000); // 15 seconds
  }

  // Check Release Assets
  console.log('\nChecking Release Assets for v0.4.0...');
  const relRes = await fetchGitHub('/repos/UG-SIDHARTH/OMNI-PDF/releases/tags/v0.4.0');
  if (relRes.status === 200) {
    console.log(`Release URL: ${relRes.json.html_url}`);
    console.log(`Release Name: ${relRes.json.name}`);
    console.log(`Assets (${relRes.json.assets?.length || 0}):`);
    (relRes.json.assets || []).forEach(a => {
      console.log(`  📦 ${a.name} (${(a.size / (1024 * 1024)).toFixed(2)} MB)`);
      console.log(`     Download: ${a.browser_download_url}`);
    });
  } else {
    console.log('Release not found or not published yet:', relRes.status, relRes.json?.message);
  }
}

trackRun();
