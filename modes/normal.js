function findFurthestAway(map, x, y) {
    let list = [];
    const name = map[x + ',' + y].name;
    for (const pos in map) {
        if (map[pos].name !== 'Unused' && map[pos].name !== name) {
            list.push(pos);
        }
    }

    return list.sort((a, b) => {
        const aX = parseInt(a.split(',')[0]);
        const aY = parseInt(a.split(',')[1]);
        const bX = parseInt(b.split(',')[0]);
        const bY = parseInt(b.split(',')[1]);

        const aDist = Math.abs((aX + aY) - (x + y));
        const bDist = Math.abs((bX + bY) - (x + y));
        return aDist - bDist;
    }).reverse();
}

function getPhoneLinesByDistance(map, x, y) {
    const lineItems = [];
    const sorted = findFurthestAway(map, x, y);

    let listPos = 0;
    for (let i = 2; i < 9; i++) {
        if (listPos < sorted.length) {
            const peerPhone = map[sorted[listPos]];
            lineItems.push({
                name: peerPhone.name,
                extension: peerPhone.extension
            });
            listPos++;
        }
    }

    return lineItems;
}

function getHostConfig(payload, extensions, pos, phone) {
    const phones = payload.phones;
    const x = parseInt(pos.split(',')[0]);
    const y = parseInt(pos.split(',')[1]);
    const lineItems = getPhoneLinesByDistance(phones, x, y);
    return {
        mac: phone.mac.toUpperCase(),
        extension: extensions[phone.name],
        name: phone.name,
        line_items: lineItems
    }
}

module.exports = {
    getHostConfig
}