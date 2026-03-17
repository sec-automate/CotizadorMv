exports.parsePrice = (price) => {
    if (!price) return 0;
    const str = price.toString().replace(',', '.');
    return parseFloat(str) || 0;
};

exports.calculateTotal = (rate, input, days) => {
    // 1. Validaciones iniciales
    const totalPeople = input.adults + input.children;
    const roomCapacity = rate.max_people_per_room || 4;
    
    // Al menos 1 adulto por habitación, se necesitan tantas habitaciones como dicten los cupos
    let numRooms = Math.ceil(totalPeople / roomCapacity);

    // Override manual: Si el usuario forzó una cantidad de habitaciones
    if (input.rooms && parseInt(input.rooms) > 0) {
        const manualRooms = parseInt(input.rooms);
        if (manualRooms < numRooms) {
            return { error: `Capacidad excedida: ${totalPeople} huéspedes requieren mínimo ${numRooms} habitaciones.` };
        }
        if (manualRooms > input.adults) {
            return { error: `No se pueden pedir ${manualRooms} habitaciones para solo ${input.adults} adultos. (Mínimo 1 adulto por hab).` };
        }
        numRooms = manualRooms;
    }

    if (input.adults < numRooms) {
        return { error: `Se requieren al menos ${numRooms} adultos para ocupar ${numRooms} habitaciones.` };
    }

    if (input.pets > numRooms) {
        return { error: `Límite de 1 mascota por habitación (Máx: ${numRooms} para esta distribución).` };
    }

    // 2. Inicializar habitaciones
    let rooms = Array.from({ length: numRooms }, () => ({ adults: 0, children: 0, pets: 0 }));

    // 3. Garantizar al menos 1 adulto por habitación (Regla obligatoria de hotelería)
    let adultsToDistribute = input.adults;
    for (let i = 0; i < numRooms; i++) {
        if (adultsToDistribute > 0) {
            rooms[i].adults = 1;
            adultsToDistribute--;
        }
    }

    // 4. Repartir el resto de adultos equitativamente (para maximizar que cada hab llegue a >=2 y obtenga descuentos de niños)
    let roomIdx = 0;
    while (adultsToDistribute > 0) {
        if (rooms[roomIdx].adults < roomCapacity) {
            rooms[roomIdx].adults++;
            adultsToDistribute--;
        }
        roomIdx = (roomIdx + 1) % numRooms;
    }

    // 5. Repartir los niños equitativamente en los espacios sobrantes
    let childrenToDistribute = input.children;
    roomIdx = 0;
    let safetyCounter = 0;
    while (childrenToDistribute > 0 && safetyCounter < 1000) {
        const currentSpace = roomCapacity - (rooms[roomIdx].adults + rooms[roomIdx].children);
        if (currentSpace > 0) {
            rooms[roomIdx].children++;
            childrenToDistribute--;
        }
        roomIdx = (roomIdx + 1) % numRooms;
        safetyCounter++;
    }

    // Si definitivamente no cupieron
    if (childrenToDistribute > 0) {
        return { error: `Error matemático distributivo: No caben ${totalPeople} huéspedes en las ${numRooms} habitaciones según la capacidad máxima (${roomCapacity}).` };
    }

    // 6. Distribuir mascotas (1 por hab)
    let petsToDistribute = input.pets;
    for (let i = 0; i < numRooms && petsToDistribute > 0; i++) {
        rooms[i].pets = 1;
        petsToDistribute--;
    }

    // 6. Configuración de precios base
    const freeChildrenLimit = parseInt(rate.free_children_count) || 0;
    const childPrice = parseFloat(rate.child_price) || 0;
    const petPrice = parseFloat(rate.pet_price) || 0;

    // 7. Cálculo por habitación
    let totalCost = 0;
    
    rooms.forEach(room => {
        // Encontrar la tarifa de adulto correspondiente (1 a 4)
        const priceKey = `adult_price_${Math.min(4, room.adults)}`;
        const adultPricePerPerson = parseFloat(rate[priceKey]) || 0;
        
        let billableChildren = room.children;
        let freeChildrenInRoom = 0;

        // Regla: Niños gratis SOLO si hay más de 1 adulto pagando tarifa
        if (room.adults > 1 && freeChildrenLimit > 0) {
            // Le damos gratis hasta el límite configurado (usualmente 1)
            freeChildrenInRoom = Math.min(billableChildren, freeChildrenLimit);
            billableChildren -= freeChildrenInRoom;
        }

        const adultTotal = room.adults * adultPricePerPerson;
        const childTotal = billableChildren * childPrice;
        const petTotal = room.pets * petPrice;
        const roomTotalNight = adultTotal + childTotal + petTotal;

        // Guardar desglose para la vista
        room.adultPricePerPerson = adultPricePerPerson;
        room.adultTotal = adultTotal;
        room.billableChildren = billableChildren;
        room.freeChildren = freeChildrenInRoom;
        room.childTotal = childTotal;
        room.petTotal = petTotal;
        room.freeChild = freeChildrenInRoom > 0;
        room.cost = roomTotalNight;

        totalCost += roomTotalNight;
    });

    return { 
        total: totalCost * days, 
        roomDetails: rooms 
    };
};

exports.isRateDateValid = (rate, checkIn, checkOut) => {
    if (rate.always_available === true || rate.always_available === 'true') return true;
    if (!rate.valid_from || !rate.valid_until) return false;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const validFrom = new Date(rate.valid_from);
    const validUntil = new Date(rate.valid_until);
    return start >= validFrom && end <= validUntil;
};
