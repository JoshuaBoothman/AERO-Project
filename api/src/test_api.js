
async function testApi() {
    try {
        const slug = 'festival-2026';
        console.log(`Fetching registrations for slug: ${slug}...`);

        // Ensure port is correct (default 7071)
        const res = await fetch(`http://localhost:7071/api/events/${slug}/public-registrations`);
        console.log(`Status: ${res.status}`);

        if (res.ok) {
            const data = await res.json();
            console.log('Data count:', data.length);
            // console.log('Data:', JSON.stringify(data.slice(0, 1), null, 2));
        } else {
            console.log('Error:', await res.text());
        }
    } catch (e) {
        console.error('Test failed:', e.message);
    }
}

testApi();
