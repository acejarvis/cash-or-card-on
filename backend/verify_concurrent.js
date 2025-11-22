const { pool } = require('./src/config/database');

async function testConcurrentLogins() {
    try {
        console.log('Starting concurrent login test...');
        const API_URL = 'http://localhost:3001/api';

        // 1. Create two users
        const email1 = `user1_${Date.now()}@test.com`;
        const email2 = `user2_${Date.now()}@test.com`;
        const password = 'password123';

        console.log('Registering User 1...');
        const res1 = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email1, username: 'User1', password })
        });

        if (res1.status !== 201) throw new Error(`User 1 registration failed: ${res1.status}`);
        const data1 = await res1.json();
        const token1 = data1.token;
        console.log('User 1 Token:', token1.substring(0, 20) + '...');

        console.log('Registering User 2...');
        const res2 = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email2, username: 'User2', password })
        });

        if (res2.status !== 201) throw new Error(`User 2 registration failed: ${res2.status}`);
        const data2 = await res2.json();
        const token2 = data2.token;
        console.log('User 2 Token:', token2.substring(0, 20) + '...');

        // 2. Verify Token 1 works
        console.log('Verifying Token 1...');
        const verify1 = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token1}` }
        });

        if (verify1.status !== 200) throw new Error(`Token 1 failed: ${verify1.status}`);
        console.log('Token 1 is VALID.');

        // 3. Verify Token 2 works
        console.log('Verifying Token 2...');
        const verify2 = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token2}` }
        });

        if (verify2.status !== 200) throw new Error(`Token 2 failed: ${verify2.status}`);
        console.log('Token 2 is VALID.');

        // 4. Verify Token 1 STILL works
        console.log('Verifying Token 1 again...');
        const verify1Again = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token1}` }
        });

        if (verify1Again.status !== 200) throw new Error(`Token 1 failed after Token 2 login: ${verify1Again.status}`);
        console.log('Token 1 is STILL VALID.');

        console.log('SUCCESS: Concurrent logins supported.');

    } catch (e) {
        console.error('FAILED:', e);
    } finally {
        await pool.end();
    }
}

testConcurrentLogins();
