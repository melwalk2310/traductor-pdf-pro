import https from 'https';

const apiKey = "AIzaSyDXRz22duQ2YzKBW39iH9-AikIzzuFdXxM"; // Hardcoded for diagnostic only as provided in error logs

function listModels() {
    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models?key=${apiKey}`,
        method: 'GET'
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log('Status Code:', res.statusCode);
            const response = JSON.parse(data);
            if (response.models) {
                console.log('Available Models:');
                response.models.forEach(m => console.log(` - ${m.name}`));
            } else {
                console.log('Response:', JSON.stringify(response, null, 2));
            }
        });
    });

    req.on('error', (error) => {
        console.error('Error:', error);
    });

    req.end();
}

listModels();
