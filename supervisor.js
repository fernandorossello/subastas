const express = require('express');
const { exec } = require('child_process');
const axios = require('axios');
const axiosRetry = require('axios-retry');

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const ProcessData = require('./model/process-data');

const config = require('./config.json');
const app = express();
const port = config.Supervisor.port;
const frontendPort = config.Frontend.port;

const restart  = Boolean(process.argv[2]) || false;
const supervisionTime = 2000

var processes = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/ping', (req, res) => res.send('pong!'));

app.put('/process', (req, res) => {
        var process = new ProcessData(req.body.address,req.body.port);
        startProcess(process)
            .then(() => {
                startReplica(process);
            })
            .then(() => {
                axios.post('http://127.0.0.1:'+frontendPort+'/process', process)
            })
            .then(() => {
                processes.push(process);
                res.send("Porcess created on port "+ process.port);
            })
            .catch(error=> {
                res.statusCode = 502;
                res.send(error.message)
            }); 
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

function startProcess(process) {
    return new Promise(function(resolve, reject) { 
        try{      
            const child = exec('node process.js ' + process.port + ' ' + process.replica);
            child.stdout.on('data', (data) => {
                console.log(`[process ${process.port} stdout]: ${data}`);
            });
            
            child.stderr.on('data', (data) => {
                console.error(`[process ${process.port} stderr]:\n${data}`);
            });

            ping(process.port)
                .then(()=>{
                    resolve();
                });            
        } catch(error) {
            reject(error.message);
        }});
       
}

function startReplica(process){
    return new Promise(function(resolve, reject) { 
        try{
            const child = exec('node replica.js ' + process.replica);
            child.stdout.on('data', (data) => {
                console.log(`[replica ${process.replica} stdout]: ${data}`);
            });
            
            child.stderr.on('data', (data) => {
                console.error(`[replica ${process.replica} stderr]:\n${data}`);
            });

            ping(process.replica)
                .then(()=>{
                    resolve();
                });  

        } catch(error) {
            reject(error.message);
        }});
}

function restartProcess(process){
    //Levanta el proceso
    //Obtener los datos para replicar
    //Setea la memoria
    startProcess(process)
        .then(res =>{
            return getMemory(process.address,process.replica)
        })
        .then(res =>{
            setMemory(process.address,process.port,res.data);
        })
        .catch(error=> {
            console.log(error.message);
        });

}

function restartReplica(process){
    //Levanta la réplica
    //Obtener los datos para replicar
    //Setea la memoria
    startReplica(process)
        .then(res =>{
           return getMemory(process.address,process.port)
        })
        .then(res =>{
            setMemory(process.address,process.replica,res.data);
        })
        .catch(error=> {
            console.log(error.message);
        });

}

// Devuelve una promise con la memoria para restaurar una replica o un proceso
function getMemory(address,port){
    return axios.get(address+':'+port+'/memory');
}

// Devuelve una promise con la respuesta de setearle la memoria a un proceso o replica
function setMemory(address,port,memory){
    return axios.post(address+':'+port+'/memory',memory);
}

function init() {
    if(restart){
        loadProcessData();
    } else {
        startFrontend(false);
    }
    
    // Supervisión de los procesos para levantarlos en caso de caídas
    setTimeout(keepAlive, supervisionTime);
}

// Función para mantener vivos todos los procesos supervisados
function keepAlive(){
   
    keepAliveFrontend();
    keepAliveProcesses();

    setTimeout(keepAlive, supervisionTime);
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
            restartProcess(process);
        });

        ping(process.replica)
        .catch( error =>{
            console.log(error.message);
            restartReplica(process);
        });
    })
}

// Genera una promise de un get de ping a un puerto determinado
function ping (port) {
    return axios.get('http://127.0.0.1:'+port+'/ping');
}

// Inicia el proceso de frontend.
function startFrontend(restart){
    console.log('Starting frontend on port '+ frontendPort);
    
    var command = 'node frontend.js ' + frontendPort
    if (restart){
        command += ' ' + true
    }

    const child = exec(command);
    
    child.stdout.on('data', (data) => {
        console.log(`[frontend stdout]: ${data}`);
    });
      
    child.stderr.on('data', (data) => {
        console.error(`[frontend stderr]:${data}`);
    });
    
}

// Permite obtener la información de los procesos que están corriendo, pidiéndosela al frontend.
function loadProcessData(){
    console.log('Obtaining data after shutdown');
    axios.get('http://localhost:'+ config.Frontend.port+'/process-list')
        .then(res => {
            processes = res.data;
        });
}

init();


