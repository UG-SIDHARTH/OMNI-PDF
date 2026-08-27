import https from 'https';

function getJobLogs() {
  const jobId = '98446251812';
  const options = {
    hostname: 'api.github.com',
    path: `/repos/UG-SIDHARTH/OMNI-PDF/actions/jobs/${jobId}/logs`,
    method: 'GET',
    headers: {
      'User-Agent': 'OmniPDF-Release-Monitor'
    }
  };

  const req = https.request(options, (res) => {
    // If redirect (302)
    if (res.statusCode === 302 && res.headers.location) {
      https.get(res.headers.location, (logRes) => {
        const chunks = [];
        logRes.on('data', (c) => chunks.push(c));
        logRes.on('end', () => {
          const logText = Buffer.concat(chunks).toString('utf8');
          const lines = logText.split('\n');
          console.log('--- LOG TAIL (LAST 40 LINES) ---');
          console.log(lines.slice(-40).join('\n'));
        });
      });
    } else {
      console.log('Response Status:', res.statusCode, res.headers);
    }
  });
  req.on('error', (err) => console.error(err));
  req.end();
}

getJobLogs();
