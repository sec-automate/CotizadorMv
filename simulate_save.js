async function simulateSave() {
    let resp;
    try {
        const payload = {
            name: "Tarifa Inverno 2",
            adult_price_1: 150,
            adult_price_2: 150,
            adult_price_3: 150,
            adult_price_4: 150,
            child_price: 75,
            pet_price: 25,
            max_people_per_room: 4,
            max_pets: 5,
            free_children_count: 0,
            valid_from: "2026-03-12",
            valid_until: "2026-03-19",
            always_available: false,
            room_type: "estandar",
            plan_type: "AI"
        };

        console.log('Sending payload:', JSON.stringify(payload, null, 2));

        resp = await fetch('http://localhost:5001/api/rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Status:', resp.status);
        console.log('Headers:', JSON.stringify([...resp.headers.entries()], null, 2));

        const text = await resp.text();
        console.log('Response content:', text);

        if (resp.ok) {
            const data = JSON.parse(text);
            console.log('Parsed JSON Success:', data);
        } else {
            console.log('Response not OK');
        }

        process.exit(0);
    } catch (err) {
        console.error('Simulation failed error:', err);
        process.exit(1);
    }
}

simulateSave();
