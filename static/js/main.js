const roomX = 13;
const roomY = 7;

let mode;

let selected;

let map = localStorage.getItem("data") !== null ? JSON.parse(localStorage.getItem("data")) : {};
let ships = localStorage.getItem("ships") !== null ? JSON.parse(localStorage.getItem("ships")) : {};
let admiral = localStorage.getItem("admiral") !== null ? JSON.parse(localStorage.getItem("admiral")) : {
    user: null,
    extension: "0"
}

const commsSelectionBoxes = {};
const captainSelectionBoxes = {};

function changeMode(newMode) {
    mode = newMode;
    document.getElementById("modeName").innerHTML = "<b>Mode:</b> " + (mode === undefined ? "None" : mode);
}

function getPrettyPhoneName(name) {
    const nameSegment = name.split('_')[0];
    const numSegment = name.split('_')[1];
    return nameSegment.charAt(0).toUpperCase() + nameSegment.substring(1) + " " + numSegment;
}

function getAllPhones() {
    const phones = {};
    for (const x in map) {
        const row = map[x];
        for (const z in map[x]) {
            const data = row[z];
            if (data.phone) {
                phones[`${x},${z}`] = data;
            }
        }
    }
    return phones;
}

function styleCell(cell) {
    const x = parseInt(cell.id.split("_")[0]);
    const y = parseInt(cell.id.split("_")[1]);
    const data = map[x][y];

    if ('rotated' in data && data.rotated) {
        cell.style.writingMode = 'vertical-rl';
    } else {
        cell.style.writingMode = '';
    }

    if (data.walkway) {
        cell.innerHTML = "Walkway";
        cell.style.backgroundColor = "lightgray";
        return;
    } else if (data.wall) {
        cell.innerHTML = "Wall";
        cell.style.backgroundColor = "gray";
        return;
    }

    let msg = x + ", " + y + "<br>";
    let used = false;
    if (data.user) {
        msg += "Player";
        if ('userName' in data && data.userName !== undefined) {
            msg += " (" + data.userName + ")<br>";
        } else {
            msg += "<br>";
        }
        cell.style.backgroundColor = "lightgreen";
        used = true;
    }

    if (data.phone) {
        const phoneName = 'phoneType' in data ? getPrettyPhoneName(data.phoneType) : 'Cisco 7970';
        msg += phoneName;
        if ('phoneMAC' in data && data.phoneMAC !== undefined) {
            msg += " (" + data.phoneMAC + ")<br>";
        } else {
            msg += "<br>";
        }

        if ('extension' in data && data.extension !== undefined) {
            msg += "(" + data.extension + ")<br>";
        }

        cell.style.backgroundColor = "lightsalmon";
        used = true;
    }

    if (!used) {
        cell.style.backgroundColor = "white";
    }

    cell.innerHTML = msg;
}

function clickCell(event) {
    const cell = event.target;
    const id = cell.id;

    const x = parseInt(id.split("_")[0]);
    const y = parseInt(id.split("_")[1]);

    if (mode === undefined && (map[x][y].user || map[x][y].phone)) {
        if (selected !== undefined) {
            const oldCell = document.getElementById(selected[0] + "_" + selected[1]);
            oldCell.style.border = null;
        }
        cell.style.border = "3px solid";

        if ('userName' in map[x][y]) {
            document.getElementById("user").value = map[x][y].userName;
        } else {
            document.getElementById("user").value = '';
        }

        if ('extension' in map[x][y]) {
            document.getElementById("extension").value = map[x][y].extension;
        } else {
            document.getElementById("extension").value = '';
        }

        if ('phoneMAC' in map[x][y]) {
            document.getElementById("phone").value = map[x][y].phoneMAC;
        } else {
            document.getElementById("phone").value = '';
        }

        if ('phoneType' in map[x][y]) {
            document.getElementById("phonetype").value = map[x][y].phoneType;
        } else {
            document.getElementById("phonetype").value = "cisco_7970";
        }

        document.getElementById("user").hidden = !map[x][y].user;
        document.getElementById("phone").hidden = !map[x][y].phone;
        document.getElementById("extension").hidden = !map[x][y].phone;
        document.getElementById("phonetype").hidden = !map[x][y].phone;
        document.getElementById("save").hidden = false;
        document.getElementById("rotate").hidden = false;
        selected = [x, y];
        return;
    }

    if (mode === undefined && selected !== undefined) {
        const oldCell = document.getElementById(selected[0] + "_" + selected[1]);
        oldCell.style.border = null;
        document.getElementById("user").hidden = true;
        document.getElementById("phone").hidden = true;
        document.getElementById("extension").hidden = true;
        document.getElementById("phonetype").hidden = true;
        document.getElementById("save").hidden = true;
        document.getElementById("rotate").hidden = true;
        selected = undefined;
        return;
    }

    if (mode === undefined) {
        return;
    }

    const newValue = !map[x][y][mode];
    map[x][y][mode] = newValue;

    if (mode === 'phone' && !newValue && 'phoneMAC' in map[x][y]) {
        map[x][y].phoneMAC = undefined;
    }

    if (mode === 'phone' && !newValue && 'extension' in map[x][y]) {
        map[x][y].extension = undefined;
    }

    if (mode === 'user' && !newValue && 'userName' in map[x][y]) {
        map[x][y].userName = undefined;
    }

    localStorage.removeItem("data");
    localStorage.setItem("data", JSON.stringify(map));
    styleCell(cell);
}

function rotate() {
    if (selected === undefined) {
        return;
    }

    const data = map[selected[0]][selected[1]];
    if ('rotated' in data && data.rotated !== undefined) {
        data.rotated = undefined;
    } else {
        data.rotated = true;
    }

    localStorage.removeItem("data");
    localStorage.setItem("data", JSON.stringify(map));

    styleCell(document.getElementById(selected[0] + "_" + selected[1]));
}

function getNextExtensionInternal() {
    let extension = 4000;
    for (const strX in map) {
        const x = parseInt(strX);
        const row = map[x];
        for (const strY in row) {
            const y = parseInt(strY);
            const seat = row[y];
            console.log(seat);
            if ('extension' in seat && seat.extension !== undefined) {
                if (typeof seat.extension === "number") {
                    extension = seat.extension;
                } else {
                    extension = parseInt(seat.extension);
                    console.log(extension);
                }
            }
        }
    }

    return extension + 1;
}

function resetExtensions() {
    for (const strX in map) {
        const x = parseInt(strX);
        const row = map[x];
        for (const strY in row) {
            const y = parseInt(strY);
            const seat = row[y];

            if (seat.phone) {
                if ('extension' in seat) {
                    delete map[strX][strY].extension;
                    styleCell(document.getElementById(strX + "_" + strY));
                }
            }
        }
    }

    localStorage.removeItem("data");
    localStorage.setItem("data", JSON.stringify(map));
}

function assignExtensions() {
    for (const strX in map) {
        const x = parseInt(strX);
        const row = map[x];
        for (const strY in row) {
            const y = parseInt(strY);
            const seat = row[y];

            if (seat.phone) {
                if (!('extension' in seat) || seat.extension === undefined) {
                    seat.extension = getNextExtensionInternal().toString();
                    console.log(seat.extension);
                    styleCell(document.getElementById(strX + "_" + strY));
                }
            }
        }
    }

    localStorage.removeItem("data");
    localStorage.setItem("data", JSON.stringify(map));
}

function saveData() {
    if (selected === undefined) {
        return;
    }

    const data = map[selected[0]][selected[1]];
    if (data.user) {
        const newVal = document.getElementById("user").value;
        map[selected[0]][selected[1]].userName = newVal.length > 0 ? newVal : undefined;
    }
    if (data.phone) {
        const newVal = document.getElementById("phone").value;
        map[selected[0]][selected[1]].phoneMAC = newVal.length > 0 ? newVal : undefined;
        map[selected[0]][selected[1]].phoneType = document.getElementById("phonetype").value;

        const extVal = document.getElementById("extension").value;
        map[selected[0]][selected[1]].extension = extVal.length > 0 ? extVal : undefined;
    }

    localStorage.removeItem("data");
    localStorage.setItem("data", JSON.stringify(map));

    const cell = document.getElementById(selected[0] + "_" + selected[1]);
    cell.style.border = null;
    document.getElementById("user").hidden = true;
    document.getElementById("phone").hidden = true;
    document.getElementById("extension").hidden = true;
    document.getElementById("phonetype").hidden = true;
    document.getElementById("save").hidden = true;
    document.getElementById("rotate").hidden = true;

    selected = undefined;
    styleCell(cell);
}

const table = document.getElementById("tab");
if (table !== undefined) {
    for (let x = 1; x <= roomY; x++) {
        const row = table.insertRow(x - 1);
        row.id = "row_" + x;
        if (!(x in map)) {
            map[x] = {};
        }
        for (let y = 1; y <= roomX; y++) {
            const cell = row.insertCell(y - 1);
            cell.id = x + "_" + y;
            cell.addEventListener("click", clickCell);
            if (!(y in map[x])) {
                map[x][y] = {
                    phone: false,
                    user: false,
                    walkway: false,
                    wall: false
                };
            }
            styleCell(cell);
        }
    }
}

// SHIPS
const shipTable = document.getElementById("ships");
let shipRows = {}

function constructHeader() {
    const tr = document.createElement("tr");
    const name = document.createElement("th");
    const captain = document.createElement("th");
    const comms = document.createElement("th");
    const captExt = document.createElement("th");
    const commsExt = document.createElement("th");
    const actions = document.createElement("th");

    name.innerHTML = "Ship Name";
    captain.innerHTML = "Captain";
    comms.innerHTML = "Comms Officer";
    captExt.innerHTML = "Captain Extension";
    commsExt.innerHTML = "Comms Extension";
    actions.innerHTML = "Actions";
    tr.appendChild(name);
    tr.appendChild(captain);
    tr.appendChild(comms);
    tr.appendChild(captExt);
    tr.appendChild(commsExt);
    tr.appendChild(actions);
    return tr;
}

function checkIsUsed(x, z) {
    for (const shipName of Object.keys(ships)) {
        const ship = ships[shipName];
        if (ship.captain === `${x},${z}`)
            return true;
        if (ship.comms === `${x},${z}`)
            return true;
    }
    return false;
}

function deleteShip(name) {
    delete ships[name];
    const row = shipRows[name];
    shipTable.deleteRow(row);
    delete shipRows[name];

    localStorage.removeItem("ships");
    localStorage.setItem("ships", JSON.stringify(ships));
}

function refreshSelection(element, shipName, captain) {
    element.innerHTML = '';
    const phones = getAllPhones();

    const posValue = shipName in ships ? ships[shipName][captain ? 'captain' : 'comms'] : null
    let found = false;

    const na = document.createElement("option");
    na.value = "";
    na.innerHTML = "Select";
    element.appendChild(na);

    for (const pos in phones) {
        const phone = phones[pos];
        if ('userName' in phone && phone.userName !== undefined) {
            if (!checkIsUsed(pos.split(",")[0], pos.split(",")[1]) || (posValue !== null && posValue == pos)) {
                const option = document.createElement("option");
                option.value = pos
                option.innerHTML = phone.userName;
                element.appendChild(option);

                if (posValue !== null && posValue === pos) {
                    element.value = pos;
                    found = true;
                }
            }
        }
    }

    if (!found && posValue !== null) {
        ships[shipName][captain ? 'captain' : 'comms'] = ''
    }
}

function addShip(name, captain, comms, captainExtension, commsExtension) {
    ships[name] = {
        captain: captain === null ? "" : captain,
        comms: comms === null ? "" : comms,
        captainExtension: captainExtension === undefined ? "0" : captainExtension,
        commsExtension: commsExtension === undefined ? "0" : commsExtension
    };
    const row = shipTable.insertRow(shipTable.rows.length);
    shipRows[name] = shipTable.rows.length - 1;

    const nameCell = row.insertCell(0);
    const captainCell = row.insertCell(1);
    const commsCell = row.insertCell(2);
    const captainExtensionCell = row.insertCell(3);
    const commsExtensionCell = row.insertCell(4);
    const actionsCell = row.insertCell(5);

    nameCell.innerHTML = name;

    const captainSelection = document.createElement("select");
    const commsSelection = document.createElement("select");
    const captainExtensionBox = document.createElement("input");
    captainExtensionBox.id = `${name}_captain_extension`
    const commsExtensionBox = document.createElement("input");
    commsExtensionBox.id = `${name}_comms_extension`
    const deleteButton = document.createElement("button");

    captainExtensionBox.value = ships[name].captainExtension
    commsExtensionBox.value = ships[name].commsExtension

    const extensionBoxes = [captainExtensionBox, commsExtensionBox];
    extensionBoxes.forEach((b) => {
        const captain = b.id.includes('captain');
        b.onchange = () => {
            if (captain)
                ships[name].captainExtension = b.value;
            else
                ships[name].commsExtension = b.value;
            localStorage.removeItem("ships");
            localStorage.setItem("ships", JSON.stringify(ships));
        };
    });

    deleteButton.innerHTML = "Delete";
    deleteButton.onclick = function () {
        deleteShip(name);
    }

    captainSelection.onchange = function () {
        ships[name].captain = captainSelection.value;
        localStorage.removeItem("ships");
        localStorage.setItem("ships", JSON.stringify(ships));
    }

    commsSelection.onchange = function () {
        ships[name].comms = commsSelection.value;
        localStorage.removeItem("ships");
        localStorage.setItem("ships", JSON.stringify(ships));
    }

    captainCell.appendChild(captainSelection);
    commsCell.appendChild(commsSelection);
    captainExtensionCell.appendChild(captainExtensionBox);
    commsExtensionCell.appendChild(commsExtensionBox);
    actionsCell.appendChild(deleteButton);
    captainSelectionBoxes[name] = captainSelection;
    commsSelectionBoxes[name] = commsSelection;
    refreshSelection(captainSelection, name, true);
    refreshSelection(commsSelection, name, false);

    localStorage.removeItem("ships");
    localStorage.setItem("ships", JSON.stringify(ships));
}

function clickAddShip() {
    addShip(document.getElementById("shipAddName").value)
}

function addAdmiralSelect(element) {
    element.innerHTML = '';
    const phones = getAllPhones();

    const na = document.createElement("option");
    na.value = "";
    na.innerHTML = "Select";
    element.appendChild(na);

    let found = false;

    for (const pos in phones) {
        const phone = phones[pos];
        if ('userName' in phone && phone.userName !== undefined) {
            if (!checkIsUsed(pos.split(",")[0], pos.split(",")[1])) {
                const option = document.createElement("option");
                option.value = pos
                option.innerHTML = phone.userName;
                element.appendChild(option);

                if (admiral.user && admiral.user === pos) {
                    element.value = pos;
                    found = true;
                }
            }
        }
    }

    if (!found) {
        admiral.user = null;
    }
}

shipTable.appendChild(constructHeader())
const keys = Object.keys(ships);
for (const key of keys) {
    const ship = ships[key];
    addShip(key, ship.captain, ship.comms, ship.captainExtension, ship.commsExtension);
}

const admiralRow = document.getElementById("admiralRow");
const admiralUserCell = admiralRow.insertCell(0);
const admiralExtensionCell = admiralRow.insertCell(1);
const admiralUserSelection = document.createElement("select");
const admiralExtensionInput = document.createElement("input");

addAdmiralSelect(admiralUserSelection)
admiralExtensionInput.value = admiral.extension

admiralExtensionInput.onchange = () => {
    admiral.extension = admiralExtensionInput.value;
    localStorage.removeItem("admiral");
    localStorage.setItem("admiral", JSON.stringify(admiral));
};

admiralUserSelection.onchange = function () {
    admiral.user = admiralUserSelection.value;
    localStorage.removeItem("admiral");
    localStorage.setItem("admiral", JSON.stringify(admiral));
}

admiralUserCell.appendChild(admiralUserSelection);
admiralExtensionCell.appendChild(admiralExtensionInput);