const roomX = 13;
const roomY = 7;

let mode;

let selected;

let map = localStorage.getItem("data") !== null ? JSON.parse(localStorage.getItem("data")) : {};

function changeMode(newMode) {
    mode = newMode;
    document.getElementById("modeName").innerHTML = "<b>Mode:</b> " + (mode === undefined ? "None" : mode);
}

function getPrettyPhoneName(name) {
    const nameSegment = name.split('_')[0];
    const numSegment = name.split('_')[1];
    return nameSegment.charAt(0).toUpperCase() + nameSegment.substring(1) + " " + numSegment;
}

function styleCell(cell) {
    const x = parseInt(cell.id.split("_")[0]);
    const y = parseInt(cell.id.split("_")[1]);
    const data = map[x][y];

    if('rotated' in data && data.rotated) {
        cell.style.writingMode = 'vertical-rl';
    } else {
        cell.style.writingMode = '';
    }

    if(data.walkway) {
        cell.innerHTML = "Walkway";
        cell.style.backgroundColor = "lightgray";
        return;
    } else if(data.wall) {
        cell.innerHTML = "Wall";
        cell.style.backgroundColor = "gray";
        return;
    }

    let msg = x + ", " + y + "<br>";
    let used = false;
    if(data.user) {
        msg += "Player";
        if('userName' in data && data.userName !== undefined) {
            msg += " (" + data.userName + ")<br>";
        } else {
            msg += "<br>";
        }
        cell.style.backgroundColor = "lightgreen";
        used = true;
    }

    if(data.phone) {
        const phoneName = 'phoneType' in data ? getPrettyPhoneName(data.phoneType) : 'Cisco 7970';
        msg += phoneName;
        if('phoneMAC' in data && data.phoneMAC !== undefined) {
            msg += " (" + data.phoneMAC + ")<br>";
        } else {
            msg += "<br>";
        }
        cell.style.backgroundColor = "lightsalmon";
        used = true;
    }

    if(!used) {
        cell.style.backgroundColor = "white";
    }

    cell.innerHTML = msg;
}

function clickCell(event) {
    const cell = event.target;
    const id = cell.id;

    const x = parseInt(id.split("_")[0]);
    const y = parseInt(id.split("_")[1]);

    if(mode === undefined && (map[x][y].user || map[x][y].phone)) {
        if(selected !== undefined) {
            const oldCell = document.getElementById(selected[0] + "_" + selected[1]);
            oldCell.style.border = null;
        }
        cell.style.border = "3px solid";

        if('userName' in map[x][y]) {
            document.getElementById("user").value = map[x][y].userName;
        } else {
            document.getElementById("user").value = '';
        }

        if('phoneMAC' in map[x][y]) {
            document.getElementById("phone").value = map[x][y].phoneMAC;
        } else {
            document.getElementById("phone").value = '';
        }

        if('phoneType' in map[x][y]) {
            document.getElementById("phonetype").value = map[x][y].phoneType;
        } else {
            document.getElementById("phonetype").value = "cisco_7970";
        }

        document.getElementById("user").hidden = !map[x][y].user;
        document.getElementById("phone").hidden = !map[x][y].phone;
        document.getElementById("phonetype").hidden = !map[x][y].phone;
        document.getElementById("save").hidden = false;
        document.getElementById("rotate").hidden = false;
        selected = [x, y];
        return;
    }

    if(mode === undefined && selected !== undefined) {
        const oldCell = document.getElementById(selected[0] + "_" + selected[1]);
        oldCell.style.border = null;
        document.getElementById("user").hidden = true;
        document.getElementById("phone").hidden = true;
        document.getElementById("phonetype").hidden = true;
        document.getElementById("save").hidden = true;
        document.getElementById("rotate").hidden = true;
        selected = undefined;
        return;
    }

    if(mode === undefined) {
        return;
    }

    const newValue = !map[x][y][mode];
    map[x][y][mode] = newValue;

    if(mode === 'phone' && !newValue && 'phoneMAC' in map[x][y]) {
        map[x][y].phoneMAC = undefined;
    }

    if(mode === 'user' && !newValue && 'userName' in map[x][y]) {
        map[x][y].userName = undefined;
    }

    localStorage.removeItem("data");
    localStorage.setItem("data", JSON.stringify(map));
    styleCell(cell);
}

function rotate() {
    if(selected === undefined) {
        return;
    }

    const data = map[selected[0]][selected[1]];
    if('rotated' in data && data.rotated !== undefined) {
        data.rotated = undefined;
    } else {
        data.rotated = true;
    }

    localStorage.removeItem("data");
    localStorage.setItem("data", JSON.stringify(map));

    styleCell(document.getElementById(selected[0] + "_" + selected[1]));
}

function saveData() {
    if(selected === undefined) {
        return;
    }

    const data = map[selected[0]][selected[1]];
    if(data.user) {
        const newVal = document.getElementById("user").value;
        map[selected[0]][selected[1]].userName = newVal.length > 0 ? newVal : undefined;
    }
    if(data.phone) {
        const newVal = document.getElementById("phone").value;
        map[selected[0]][selected[1]].phoneMAC = newVal.length > 0 ? newVal : undefined;
        map[selected[0]][selected[1]].phoneType = document.getElementById("phonetype").value;
    }

    localStorage.removeItem("data");
    localStorage.setItem("data", JSON.stringify(map));

    const cell = document.getElementById(selected[0] + "_" + selected[1]);
    cell.style.border = null;
    document.getElementById("user").hidden = true;
    document.getElementById("phone").hidden = true;
    document.getElementById("phonetype").hidden = true;
    document.getElementById("save").hidden = true;
    document.getElementById("rotate").hidden = true;

    selected = undefined;
    styleCell(cell);
}

const table = document.getElementById("tab");
if(table !== undefined) {
    for(let x = 1; x <= roomY; x++) {
        const row = table.insertRow(x-1);
        row.id = "row_" + x;
        if(!(x in map)) {
            map[x] = {};
        }
        for(let y = 1; y <= roomX; y++) {
            const cell = row.insertCell(y-1);
            cell.id = x + "_" + y;
            cell.addEventListener("click", clickCell);
            if(!(y in map[x])) {
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