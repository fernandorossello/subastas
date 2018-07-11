const express = require('express');
const { exec } = require('child_process');
const axios = require('axios');

const ProcessData = require('./process-data');

const config = require('./config.json');
const app = express();
const port = config.Supervisor.port;
const frontendPort = config.Frontend.port;

var processes = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/ping', (req, res) => res.send('pong!'));

app.put('/process', (req, res) => {
    console.log(req.body);
    try {
        var process = new ProcessData(req.body.port)
        createProcess(process.port);
        processes.push(process);
        axios.post('http://127.0.0.1:'+frontendPort+'/process',process)
        .then(response => {
            res.send("Porcess created on port "+ process.port);
        })
        .catch(error=> {
            res.statusCode = 502;
            res.send(error.message)
        });        
    } catch(error) {
        res.statusCode = 502;
        res.send(error.message)
    }
});

app.get('/process-list', (req, res) =>{
    try {
        res.send(processes);
    } catch(error) {
        res.statusCode = 502;
        res.send(error.message)
    }
});

app.listen(port, () => console.log('Supervisor online on port '+ port));

function createProcess(port) {
        console.log('Starting process on port '+ port);
        exec('node process.js ' + port);
}


function init() {
    console.log('Starting frontend on port '+ frontendPort);
    exec('node frontend.js ' + frontendPort);
}

init();