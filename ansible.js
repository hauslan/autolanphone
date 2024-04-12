const yaml = require('js-yaml');
const fs = require('fs');

module.exports = function (payload) {
    const modeName = 'mode' in payload ? payload.mode.toLowerCase() : 'ansible';
    let doc = yaml.load(fs.readFileSync('./ansible/template.yaml', 'utf-8'));

    const mode = require('./modes/' + modeName);

    let phoneTypes = [];
    const extensions = {}
    for (const pos in payload.phones) {
        const phone = payload.phones[pos];
        if (phoneTypes.indexOf(payload.phones[pos].type) === -1) {
            phoneTypes.push(payload.phones[pos].type);
        }

        if (!('extension' in phone)) {
            console.error(`${phone.name} has no extension!`);
            return;
        } else {
            extensions[phone.name] = phone.extension;
        }
    }

    for (const type of phoneTypes) {
        doc.all.children[type] = {};
        doc.all.children[type].hosts = {};
    }

    doc.all.children["phones"] = {}
    doc.all.children["phones"].hosts = {}

    for (const pos in payload.phones) {
        const phone = payload.phones[pos];
        if (phone.mac === 'Unknown') {
            console.error('Phone with no MAC - skipping.')
            continue;
        }

        if (!(phone.name in extensions)) {
            console.error("Missing " + phone.name)
            continue;
        }

        doc.all.children["phones"].hosts['SEP' + phone.mac.toUpperCase()] = mode.getHostConfig(payload, extensions, pos, phone);
    }

    fs.writeFileSync(`./ansible/${modeName}.yaml`, yaml.dump(doc));
}