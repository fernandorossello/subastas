const express = require('express');

const app = express();
const port = process.argv[2];

var processes = [];

app.use(express.json() );
app.use(express.urlencoded({ extended: true }));

app.get('/ping', (req, res) => res.send('pong!'));

app.post('/process', (req, res) => {
    try {
        processes.push(req.body);
        res.send();
    } catch(error) {
        res.statusCode = 502;
        res.send(error.message)
    }
});

app.get('/process-list', (req, res) => {
    try {
        res.send(processes);
    } catch(error) {
        res.statusCode = 502;
        res.send(error.message)
    }
});

app.listen(port, () => console.log('Frontend online on port '+ port));