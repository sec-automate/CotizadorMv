export const parsePrice = (price) => {
    if (!price) return 0;
    const str = price.toString().replace(',', '.');
    return parseFloat(str) || 0;
};

export const calculateTotal = (rate, input, days) => {
    const totalPeople = input.adults + input.children;
    const roomCapacity = rate.max_people_per_room || 4;
    const numRooms = Math.ceil(totalPeople / roomCapacity);

    if (input.adults < numRooms) {
        return { error: `Se requieren al menos ${numRooms} adultos para ${numRooms} habitaciones.` };
    }

    let rooms = [];
    for (let i = 0; i < numRooms; i++) {
        rooms.push({ adults: 0, children: 0 });
    }

    let adultsToDistribute = input.adults;
    let roomIdx = 0;
    while (adultsToDistribute > 0) {
        rooms[roomIdx].adults++;
        adultsToDistribute--;
        roomIdx = (roomIdx + 1) % numRooms;
    }

    let petsToDistribute = input.pets;
    roomIdx = 0;
    while (petsToDistribute > 0 && roomIdx < numRooms) {
        rooms[roomIdx].pets = 1;
        petsToDistribute--;
        roomIdx++;
    }
    // Initialize pets to 0 for rooms without pets
    rooms.forEach(r => { if (!r.pets) r.pets = 0; });

    let childrenToDistribute = input.children;
    roomIdx = 0;
    let attempts = 0;
    const maxAttempts = input.children * numRooms * 2;

    while (childrenToDistribute > 0 && attempts < maxAttempts) {
        const currentTotal = rooms[roomIdx].adults + rooms[roomIdx].children;
        if (currentTotal < roomCapacity) {
            rooms[roomIdx].children++;
            childrenToDistribute--;
        }
        roomIdx = (roomIdx + 1) % numRooms;
        attempts++;
    }

    if (childrenToDistribute > 0) return { error: `No hay suficiente espacio en las habitaciones.` };

    if (input.pets > numRooms) {
        return { error: `Límite de 1 mascota por habitación excedido (Máx: ${numRooms} para esta distribución).` };
    }

    // Free children: 1 free child per room if the room has more than 1 adult AND the rate enables it (free_children_count > 0)
    const freeChildEnabled = parseInt(rate.free_children_count) > 0;

    const childPrice = parseFloat(rate.child_price) || 0;
    const petPrice = parseFloat(rate.pet_price) || 0;

    let totalCost = 0;
    rooms.forEach(room => {
        const numAdults = Number(room.adults);
        const numChildren = Number(room.children);
        const priceKey = `adult_price_${Math.min(4, numAdults)}`;
        const adultPricePerPerson = parseFloat(rate[priceKey]) || 0;
        let billableChildren = numChildren;

        // 1 free child per room if room has more than 1 adult and rate enables free children
        if (freeChildEnabled && numAdults > 1 && billableChildren > 0) {
            billableChildren -= 1;
        }

        const adultTotal = numAdults * adultPricePerPerson;
        const childTotal = billableChildren * childPrice;
        const petTotal = (Number(room.pets) || 0) * petPrice;
        const roomCost = adultTotal + childTotal + petTotal;

        // Store breakdown for display
        room.adultPricePerPerson = adultPricePerPerson;
        room.adultTotal = adultTotal;
        room.billableChildren = billableChildren;
        room.childTotal = childTotal;
        room.petTotal = petTotal;
        room.freeChild = (freeChildEnabled && numAdults > 1 && numChildren > 0);

        room.cost = roomCost;
        totalCost += roomCost;
    });

    return { total: totalCost * days, roomDetails: rooms };
};

export const isRateDateValid = (rate, checkIn, checkOut) => {
    if (rate.always_available === true || rate.always_available === 'true') return true;
    if (!rate.valid_from || !rate.valid_until) return false;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const validFrom = new Date(rate.valid_from);
    const validUntil = new Date(rate.valid_until);
    return start >= validFrom && end <= validUntil;
};
