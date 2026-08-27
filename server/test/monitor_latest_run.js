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

async function main() {
  console.log('Fetching latest workflow run for tag v0.4.0...');
  let latestRunId = null;

  for (let i = 0; i < 5; i++) {
    const res = await fetchGitHub('/repos/UG-SIDHARTH/OMNI-PDF/actions/runs');
    if (res.status === 200 && res.json.workflow_runs) {
      const latest = res.json.workflow_runs[0];
      if (latest) {
        latestRunId = latest.id;
        console.log(`Latest Run ID: ${latest.id} | Event: ${latest.event} | Status: ${latest.status} | URL: ${latest.html_url}`);
        break;
      }
    }
    await sleep(3000);
  }

  if (!latestRunId) {
    console.error('Could not find latest workflow run');
    return;
  }

  let completed = false;
  let attempts = 0;

  while (!completed && attempts < 60) {
    attempts++;
    const res = await fetchGitHub(`/repos/UG-SIDHARTH/OMNI-PDF/actions/runs/${latestRunId}`);
    if (res.status === 200 && res.json) {
      const r = res.json;
      console.log(`\n[Poll ${attempts}] Status: ${r.status} | Conclusion: ${r.conclusion || 'in_progress'}`);
      
      const jobsRes = await fetchGitHub(`/repos/UG-SIDHARTH/OMNI-PDF/actions/runs/${latestRunId}/jobs`);
      if (jobsRes.status === 200 && jobsRes.json.jobs) {
        jobsRes.json.jobs.forEach(j => {
          console.log(`  - ${j.name.padEnd(40)} : ${j.status.padEnd(12)} (${j.conclusion || 'running'})`);
        });
      }

      if (r.status === 'completed') {
        completed = true;
        console.log(`\n================================================================`);
        console.log(`🎉 Workflow ${latestRunId} Finished! Conclusion: ${r.conclusion}`);
        console.log(`================================================================\n`);
        break;
      }
    }
    await sleep(20000); // 20 seconds between polls
  }

  // Verify GitHub Release Assets
  console.log('Checking Release Assets for v0.4.0...');
  const relRes = await fetchGitHub('/repos/UG-SIDHARTH/OMNI-PDF/releases/tags/v0.4.0');
  if (relRes.status === 200) {
    console.log(`Release Tag: ${relRes.json.tag_name} | Release Name: ${relRes.json.name}`);
    console.log(`Release Page: ${relRes.json.html_url}`);
    console.log(`Total Assets: ${relRes.json.assets?.length || 0}`);
    (relRes.json.assets || []).forEach(a => {
      console.log(`  📦 ${a.name} (${(a.size / (1024 * 1024)).toFixed(2)} MB)`);
      console.log(`     URL: ${a.browser_download_url}`);
    });
  } else {
    console.log('Release not found or not published yet:', relRes.status, relRes.json?.message);
  }
}

main();
