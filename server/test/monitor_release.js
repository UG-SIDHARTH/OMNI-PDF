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

async function monitorWorkflow() {
  console.log('Fetching recent GitHub Actions runs for UG-SIDHARTH/OMNI-PDF...\n');
  const res = await fetchGitHub('/repos/UG-SIDHARTH/OMNI-PDF/actions/runs');
  if (res.status === 200 && res.json.workflow_runs) {
    const runs = res.json.workflow_runs.slice(0, 5);
    for (const r of runs) {
      console.log(`Run ID: ${r.id} | Event: ${r.event} | Branch/Tag: ${r.head_branch} | Status: ${r.status} | Conclusion: ${r.conclusion} | Name: "${r.name}"`);
      console.log(`URL: ${r.html_url}`);
    }
  } else {
    console.log('GitHub API Status:', res.status, res.json?.message || res.json);
  }

  console.log('\nFetching GitHub Release for tag v0.4.0...');
  const relRes = await fetchGitHub('/repos/UG-SIDHARTH/OMNI-PDF/releases/tags/v0.4.0');
  if (relRes.status === 200) {
    console.log(`✅ Release Tag: ${relRes.json.tag_name} | Name: ${relRes.json.name}`);
    console.log(`HTML URL: ${relRes.json.html_url}`);
    console.log(`Assets (${relRes.json.assets?.length || 0}):`);
    (relRes.json.assets || []).forEach(a => {
      console.log(`  - ${a.name} (${(a.size / (1024 * 1024)).toFixed(2)} MB) -> ${a.browser_download_url}`);
    });
  } else {
    console.log(`Release tag v0.4.0 not created yet (HTTP ${relRes.status}):`, relRes.json?.message);
  }
}

monitorWorkflow();
