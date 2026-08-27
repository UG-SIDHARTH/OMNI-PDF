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

async function checkPastRuns() {
  const res = await fetchGitHub('/repos/UG-SIDHARTH/OMNI-PDF/actions/runs/32651038369/jobs');
  console.log('Run 32651038369 Jobs:');
  if (res.json && res.json.jobs) {
    res.json.jobs.forEach(j => {
      console.log(`Job: ${j.name} | Status: ${j.status} | Conclusion: ${j.conclusion}`);
      j.steps.forEach(s => console.log(`  - ${s.name}: ${s.conclusion}`));
    });
  }
}

checkPastRuns();
