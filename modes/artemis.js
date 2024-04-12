function generateAdmiralLines(data) {
    const keys = Object.keys(data.artemis.ships);
    const lines = [];

    for(let i = 0; i < keys.length; i++) {
        if(i >= 7)
            break;
        
        const shipName = keys[i];
        const shipData = data.artemis.ships[shipName];
        lines.push({
            name: `${shipName} Capt`,
            extension: shipData['captain']['extension']
        })
    }

    return lines;
}

function getShip(data, pos) {
    for(const shipName in data.artemis.ships) {
        const ship = data.artemis.ships[shipName];
        if(ship.captain.user === pos)
            return [shipName, true];
        if(ship.comms.user === pos)
            return [shipName, false];
    }

    return null;
}

function generateShipLines(data, shipName, captain) {
    const lines = [];

    const otherUser = data.artemis.ships[shipName][captain ? 'comms' : 'captain']
    lines.push({
        name: `${shipName} ${captain ? "Comms" : "Captain"}`,
        extension: otherUser.extension
    })
    
    if(captain) {
        if('admiral' in data.artemis) {
            lines.push({
                name: `Fleet Admiral`,
                extension: data.artemis.admiral.extension
            })
        }
    } else {
        for(const otherShipName in data.artemis.ships) {
            if(otherShipName === shipName)
                continue;
            lines.push({
                name: `${otherShipName} Comms`,
                extension: data.artemis.ships[otherShipName].comms.extension
            })
        }
    }

    return lines;
}

function getHostConfig(payload, extensions, pos, phone) {
    if('admiral' in payload.artemis) {
        if(payload.artemis.admiral.user === pos) {
            return {
                mac: phone.mac.toUpperCase(),
                extension: extensions[phone.name],
                name: "Fleet Admiral",
                line_items: generateAdmiralLines(payload)
            }
        }
    }

    const ship = getShip(payload, pos);
    if(ship !== null) {
        return {
            mac: phone.mac.toUpperCase(),
            extension: extensions[phone.name],
            name: `${ship[0]} ${ship[1] ? "Captain" : "Comms"}`,
            line_items: generateShipLines(payload, ship[0], ship[1])
        };
    }

    return require('./normal').getHostConfig(payload, extensions, pos, phone);
}

module.exports = {getHostConfig}