function showMessage(okay) {
    const color = okay ? "green" : "red";
    const message = okay ? "Woo! Your ansible is waiting for you" : "Oh no, something went wrong..";

    document.getElementById("convertError").innerHTML = message;
    document.getElementById("convertError").style.color = color;
}

function getNextExtension(map) {
    let extension = 1;
    for (const strX in map) {
        const x = parseInt(strX);
        const row = map[x];
        for (const strY in row) {
            const y = parseInt(strY);
            const seat = row[y];
            if('extension' in seat && seat.extension !== undefined) {
                extension = parseInt(seat.extension);
            }
        }
    }

    return extension + 1;
}

function mapVenue() {
    if (localStorage.getItem("data") === undefined) {
        console.error('Data is not defined.');
        return;
    }

    const artemisMode = document.getElementById("artemisMode")
    const map = JSON.parse(localStorage.getItem("data"));
    const shipsRaw = localStorage.getItem("ships") != null ? JSON.parse(localStorage.getItem("ships")) : {};
    const admiralRaw = localStorage.getItem("admiral") !== null ? JSON.parse(localStorage.getItem("admiral")) : {user: null, extension: "0"};
    let partners = {};
    let phones = {};

    for (const strX in map) {
        const x = parseInt(strX);
        const row = map[x];
        for (const strY in row) {
            const y = parseInt(strY);
            const seat = row[y];

            if(seat.walkway || seat.wall)
                continue;

            if (seat.user) {
                if ((x + "," + y) in partners) {
                    console.log('Seat ' + x + "," + y + " already has a partner.");
                } else {
                    const rotated = seat.rotated;
                    if (rotated) {
                        console.log('Seat ' + x + ',' + y + ' is rotated, checking next row.');
                        if (!(x + 1 in map)) {
                            console.log('Seat ' + x + ',' + y + ' has no partner! (X does not exist for next row.)')
                        } else if (!(y in map[x + 1])) {
                            console.log('Seat ' + x + ',' + y + ' has no partner! (Y does not exist on next row.)');
                        } else if (!map[x + 1][y].user) {
                            console.log('Seat ' + x + ',' + y + ' has no partner! (No seat on next row)');
                        } else if (!map[x + 1][y].rotated) {
                            console.log('Seat ' + x + ',' + y + ' has no partner! (Seat on next row is not rotated.)');
                        } else {
                            console.log('Seat ' + x + ',' + y + ' has partner at ' + (x + 1) + ',' + y);
                            partners[x + ',' + y] = (x + 1) + ',' + y;
                            partners[(x + 1) + ',' + y] = x + ',' + y;
                        }
                    } else {
                        if (!((y + 1) in row)) {
                            console.log('Seat ' + x + ',' + y + ' has no partner! (Next seat does not exist.)');
                        } else if (!row[y + 1].user) {
                            console.log('Seat ' + x + ',' + y + ' has no partner! (Next seat is not a seat.)');
                        } else if (row[y + 1].rotated) {
                            console.log('Seat ' + x + ',' + y + ' has no partner! (Next seat is rotated.)');
                        } else {
                            console.log('Seat ' + x + ',' + y + ' has partner at ' + x + ',' + (y + 1));
                            partners[x + ',' + y] = x + ',' + (y + 1)
                            partners[x + ',' + (y + 1)] = x + ',' + y;
                        }

                        if (!((y - 1) in row)) {
                            console.log('Seat ' + x + ',' + y + ' has no partner! (Next seat does not exist.)');
                        } else if (!row[y - 1].user) {
                            console.log('Seat ' + x + ',' + y + ' has no partner! (Next seat is not a seat.)');
                        } else if (row[y - 1].rotated) {
                            console.log('Seat ' + x + ',' + y + ' has no partner! (Next seat is rotated.)');
                        } else {
                            console.log('Seat ' + x + ',' + y + ' has partner at ' + x + ',' + (y - 1));
                            partners[x + ',' + y] = x + ',' + (y - 1)
                            partners[x + ',' + (y - 1)] = x + ',' + y;
                        }
                    }
                }
            }

            if(seat.phone) {
                let partnerName;
                if((x + ',' + y) in partners) {
                    const list = partners[x + ',' + y].split(',');
                    const partnerX = parseInt(list[0]);
                    const partnerY = parseInt(list[1]);

                    const seat = map[partnerX][partnerY];
                    if(!seat.phone) {
                        partnerName = ('userName' in seat) ? seat.userName : undefined;
                    }
                }

                const ourName = seat.userName;
                const mac = 'phoneMAC' in seat ? seat.phoneMAC : 'Unknown';
                const type = 'phoneType' in seat ? seat.phoneType : 'cisco_7970';
                const extension = 'extension' in seat ? parseInt(seat.extension) : getNextExtension(map);
                if(ourName === undefined && partnerName === undefined) {
                    phones[x + ',' + y] = {name: 'Unused', mac: mac, extension: extension, type: type};
                } else if(ourName !== undefined && partnerName === undefined) {
                    phones[x + ',' + y] = {name: ourName, mac: mac, extension: extension, type: type};
                } else if(ourName === undefined && partnerName !== undefined) {
                    phones[x + ',' + y] = {name: partnerName, mac: mac, extension: extension, type: type};
                } else {
                    phones[x + ',' + y] = {name: ourName + ' / ' + partnerName, mac: mac, extension: extension, type: type};
                }
            }
        }
    }

    const artemis = {
        ships: {},
        admiral: {
            user: admiralRaw.user,
            extension: parseInt(admiralRaw.extension)
        }
    };
    for(const shipName in shipsRaw) {
        const ship = shipsRaw[shipName]
        artemis.ships[shipName] = {
            captain: {
                user: ship['captain'],
                extension: parseInt(ship['captainExtension'])
            },
            comms: {
                user: ship['comms'],
                extension: parseInt(ship['commsExtension'])
            }
        }
    }

    const data = {
        phones: phones,
        artemis: artemis,
        mode: artemisMode.checked ? 'artemis' : 'ansible'
    }

    fetch("/convert", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    }).then((r) => {
        showMessage(r.ok);
    }).catch((err) => {
        console.error(err);
        showMessage(false);
    });

    console.log(JSON.stringify(partners));
    console.log(JSON.stringify(phones));
}