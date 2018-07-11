const express = require('express');
const { exec } = require('child_process');

const config = require('./config.json');
const app = express();
const port = config.Supervisor.port;

app.use(express.json() );
app.use(express.urlencoded({ extended: true }));

app.get('/ping', (req, res) => res.send('pong!'));

app.put('/process', (req, res) =>{
    console.log(req.body);
    try {
        createProcess(req.body.port);
        res.send("Porcess created on port "+ req.body.port);
    } catch(error) {
        res.statusCode = 502;
        res.send(error)
    }
});

app.listen(port, () => console.log('Supervisor online on port '+ port));

function createProcess(port) {
        console.log('Starting process on port '+ port);
        exec('node process.js ' + port);
}

function init() {
    frontendPort = config.Frontend.port;
    console.log('Starting frontend on port '+ frontendPort);
    exec('node frontend.js ' + frontendPort);
}

init();