const express = require('express');
const axios = require('axios');
const config = require('./config.json');
const axiosRetry = require('axios-retry');

const app = express();
const port = process.argv[2];
const restart = process.argv[3] ? process.argv[3] : false;

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

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

app.get('/ping-to-process', (req, res) => {
        const process = getProcess();

        axios.get(process.address+":"+process.port+"/ping")
        .then(response =>{
            res.status = response.status;
            res.send(response.data);
        })
        .catch(error => {
            res.status = response.status;
            res.send(error.message);
        });
});

app.get('/status', (req, res) => {
    const promises = processes.map( server => axios.get(server.address+":"+server.port+"/ping"));
    Promise.all(promises).then(results => res.json(results.map(el => el.headers["x-server-name"]+':'+el.statusText)) );
});

app.listen(port, () => console.log('Frontend online on port '+ port));

function init() {
    if(restart){
        loadProcessData();
    }
}

function loadProcessData(){
    console.log('Obtaining data after shutdown');
    axios.get('http://localhost:'+ config.Supervisor.port+'/process-list')
        .then(res => {
            processes = res.data;
        });
}

function getProcess(){
    return processes[Math.floor(processes.length * Math.random())];
}

init();