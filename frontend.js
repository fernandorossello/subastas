const express = require('express');
const axios = require('axios');
const config = require('./config.json');
const axiosRetry = require('axios-retry');
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const Bid = require('./model/bid');

const app = express();

const port = process.argv[2];
const restart = Boolean(process.argv[3]) || false;

const UniqueIDGenerator = require('./helpers/uniqueID')
const uniqueIDGenerator = new UniqueIDGenerator();
var processes = [];

app.use(express.json() );
app.use(express.urlencoded({ extended: true }));


function init() {
    if(restart){
        loadProcessData();
    }
}

function loadProcessData(){
    console.log('Obtaining data after shutdown');
    axios.get('http://localhost:'+ config.Supervisor.port+'/process')
        .then(res => {
            processes = res.data;
        });
}

// Genera un post al proceso dado para cargar un comprador
function addBuyer(process,buyer){
    return axios.post(process.address+":"+process.port+"/buyers",buyer);    
}

// Devuelve un proceso cualquiera de la lista de procesos levantados
function getProcessRandomly() {
    return processes[Math.floor(processes.length * Math.random())];
}

init();

app.listen(port, () => console.log('Frontend online on port '+ port));

//INTERFAZ
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

app.get('/process', (req, res) => {
    try {
        res.send(processes);
    } catch(error) {
        res.statusCode = 502;
        res.send(error.message)
    }
});

app.get('/ping-to-process', (req, res) => {
        const process = getProcessRandomly();

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

app.post('/buyers',(req, res) => {
    var process = getProcessRandomly();
    var buyer = req.body
    addBuyer(process,buyer)
        .then(response=>{
            res.send(response.data);
            processes
                .filter(p => p.port != process.port) //TODO: Reemplazar comparación por ID
                .forEach(p => { 
                    addBuyer(p,buyer) });
        })
        .catch(error => {
            res.status = 502;
            res.send(error.message);
        })
});

app.post('/bids',(req, res) => {
    var process = getProcessRandomly();
    var bid = Object.setPrototypeOf(req.body, Bid.prototype);
    bid.id = process.id +'-'+ uniqueIDGenerator.getUID();
    axios.post(process.address+":"+process.port+"/bids", bid)
    .then(response=>{
        res.send(response.data);
    })
    .catch(error => {
        res.status = 502;
        res.send(error.message);
    })    
});

app.post('/bids/:id',(req, res) => {

});
