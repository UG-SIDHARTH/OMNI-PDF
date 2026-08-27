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
        resolve({ status: res.statusCode, headers: res.headers, body, json });
      });
    });
    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    req.end();
  });
}

async function getJobDetails() {
  const runId = '33051014424';
  const jobsRes = await fetchGitHub(`/repos/UG-SIDHARTH/OMNI-PDF/actions/runs/${runId}/jobs`);
  if (jobsRes.status === 200 && jobsRes.json.jobs) {
    const winJob = jobsRes.json.jobs.find(j => j.name.includes('Windows'));
    console.log('Windows Job Details:');
    console.log(`ID: ${winJob.id} | Status: ${winJob.status} | Conclusion: ${winJob.conclusion}`);
    console.log('Steps:');
    winJob.steps.forEach(s => {
      console.log(`  - Step: ${s.name.padEnd(35)} | Status: ${s.status} | Conclusion: ${s.conclusion || 'pending'}`);
    });
  }
}

getJobDetails();
