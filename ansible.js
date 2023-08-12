const yaml = require('js-yaml');
const fs = require('fs');

function generateRandomPassword() {
    const length = 8;
    let pass = "";
    for(let i = 0; i < length; i++) {
        pass += Math.floor(Math.random() * 10);
    }
    return pass;
}

function findFurthestAway(map, x, y) {
    let list = [];
    const name = map[x + ',' + y].name;
    for(const pos in map) {
        if(map[pos].name !== 'Unused' && map[pos].name !== name) {
            list.push(pos);
        }
    }

    return list.sort((a,b) => {
        const aX = parseInt(a.split(',')[0]);
        const aY = parseInt(a.split(',')[1]);
        const bX = parseInt(b.split(',')[0]);
        const bY = parseInt(b.split(',')[1]);

        const aDist = Math.abs((aX + aY) - (x + y));
        const bDist = Math.abs((bX + bY) - (x + y));
        return aDist - bDist;
    }).reverse();
}

module.exports = function(map) {
    let doc = yaml.load(fs.readFileSync('./ansible/template.yaml', 'utf-8'));
    
    let phoneTypes = [];
    for(const pos in map) {
        if(phoneTypes.indexOf(map[pos].type) === -1) {
            phoneTypes.push(map[pos].type);
        }
    }

    for(const type of phoneTypes) {
        doc.all.children[type] = {};
        doc.all.children[type].hosts = {};
    }

    for(const pos in map) {
        const phone = map[pos];
        if(phone.mac === 'Unknown') {
            console.error('Phone with no MAC - skipping.')
            continue;
        }
    
        doc.all.children[phone.type].hosts['SEP' + phone.mac.toUpperCase()] = {
            legacy_sip_mode: true,
            phone_name: phone.name,
            phone_extension: phone.extension,
            phone_extension_password: generateRandomPassword(),
            sccp: false,
            mac_addr: phone.mac.toUpperCase()
        };
    
        const x = parseInt(pos.split(',')[0]);
        const y = parseInt(pos.split(',')[1]);
        const sorted = findFurthestAway(map, x, y);
    
        let listPos = 0;
        for(let i = 2; i < 9; i++) {
            if(listPos < sorted.length) {
                const peerPhone = map[sorted[listPos]];
                doc.all.children[phone.type].hosts['SEP' + phone.mac.toUpperCase()]['line_' + i + '_name'] = peerPhone.name;
                doc.all.children[phone.type].hosts['SEP' + phone.mac.toUpperCase()]['line_' + i + '_extension'] = peerPhone.extension;
                listPos++;
            }
        }
    }

    fs.writeFileSync('./ansible/ansible.yaml', yaml.dump(doc));
}