const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    console.log('Starting upload test (native fetch)...');

    // 1. Create a dummy video file
    const filePath = path.join(__dirname, 'test-video.mp4');
    fs.writeFileSync(filePath, 'dummy video content');
    console.log('Created dummy video file');

    // 2. Login to get token
    console.log('Registering temp user...');
    const unique = Date.now();
    const loginRes = await fetch('http://127.0.0.1:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: `testuser${unique}`,
            email: `test${unique}@example.com`,
            password: 'Password123!', // Strong password
            firstName: 'Test',
            lastName: 'User',
            name: 'Test User' // Sending name too just in case
        })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
        throw new Error('Login failed: ' + JSON.stringify(loginData));
    }
    const token = loginData.data.accessToken;
    console.log('Got auth token:', token ? 'Yes' : 'No');

    // 3. Upload File
    const formData = new FormData();
    formData.append('content', 'Test video upload from script');
    
    // In Node.js, we need to create a Blob from the file
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'video/mp4' });
    formData.append('media', blob, 'test-video.mp4');

    console.log('Sending upload request...');
    const uploadRes = await fetch('http://127.0.0.1:3000/api/thread', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
            // Do NOT set Content-Type here, let fetch handle the boundary
        },
        body: formData
    });

    const uploadData = await uploadRes.json();
    console.log('Upload response status:', uploadRes.status);
    console.log('Upload response data:', JSON.stringify(uploadData, null, 2));

    if (uploadRes.ok && uploadData.data.media) {
        console.log('SUCCESS: Media object found in response!');
        console.log('Media URL:', uploadData.data.media.url);
    } else {
        console.error('FAILURE: Media object missing or request failed!');
    }

    // Cleanup
    fs.unlinkSync(filePath);

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testUpload();
