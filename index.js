const express = require('express');
const ansible = require('./ansible');
const exp = require('constants');

const app = express();
const port = process.env['LAN_PORT'] || 3000;

app.use(express.static('static'));
app.use(express.json());

app.post('/convert', (req, res) => {
    try {
        ansible(req.body);
        res.status(200);
        res.send('OK');
    } catch(err) {
        console.error(err);
        res.status(500);
        res.send('NOT OK');
    }
});

app.listen(port, () => {
    console.log(`AutoLanPhone listening on port ${port}`);
});