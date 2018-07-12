const express = require('express');
const { exec } = require('child_process');
const axios = require('axios');

const ProcessData = require('./process-data');

const config = require('./config.json');
const app = express();
const port = config.Supervisor.port;
const frontendPort = config.Frontend.port;

const restart = process.argv[2] ? process.argv[2] : false;

var processes = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/ping', (req, res) => res.send('pong!'));

app.put('/process', (req, res) => {
    console.log(req.body);
    try {
        var process = new ProcessData("http://"+"localhost",req.body.port);

        startProcess(process.port);
        startProcess(process.replic);
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

function startProcess(port) {
        console.log('Starting process on port '+ port);
        exec('node process.js ' + port);
}

function init() {

    if(restart){
        loadProcessData();
    } else {
        startFrontend();
    }
    
    // Supervisión de los procesos para levantarlos en caso de caídas
    setTimeout(keepAlive, 1500);
}

function keepAlive(){
    var ports = [frontendPort]
    
    keepAliveFrontend();
    keepAliveProcesses();

    setTimeout(keepAlive, 1500);
}

// Mantiene levantado el frontend
function keepAliveFrontend(){
    ping(frontendPort)
    .catch( error =>{
        console.log(error.message);
        startFrontend(true);
    });
}

// Mantiene levantados los procesos que manejan las subastas
function keepAliveProcesses(){
    processes.forEach(process => {
        ping(process.port)
        .catch( error =>{
            console.log(error.message);
            startProcess(process.port);
        });
    })
}

function ping (port) {
    return axios.get('http://127.0.0.1:'+port+'/ping',process);
}

// Inicia el proceso de frontend.
function startFrontend(restart){
    console.log('Starting frontend on port '+ frontendPort);
    exec('node frontend.js ' + frontendPort + ' ' + restart);
}

// Permite obtener la información de los procesos que están corriendo, pidiendosela al frontend.
function loadProcessData(){
    console.log('Obtaining data after shutdown');
    axios.get('http://localhost:'+ config.Frontend.port+'/process-list')
        .then(res => {
            processes = res.data;
        });
}

init();


