const express = require('express');
const axios = require('axios');
const config = require('./config.json');
const axiosRetry = require('axios-retry');

const Bid = require('./model/bid');
const Offer = require('./model/offer');
const ProcessData = require('./model/process-data');

const http = axios.create();
http.defaults.timeout = 2500;
axiosRetry(http, { retries: 3, shouldResetTimeout:true, retryDelay: function (retryCount) {return retryCount*2000}});


const app = express();

const port = process.argv[2];

const UniqueIDGenerator = require('./helpers/uniqueID')
const uniqueIDGenerator = new UniqueIDGenerator();
var processes = [];

app.use(express.json() );
app.use(express.urlencoded({ extended: true }));

// Genera un post al proceso dado para cargar un comprador.
function addBuyer(process,buyer){
    return http.post(process.getURL()+"/buyers",buyer);    
}

// Devuelve un proceso cualquiera de la lista de procesos levantados.
function getProcessRandomly() {
    return processes[Math.floor(processes.length * Math.random())];
}

// Devuelve el proceso con el ID indicado.
function getProcessByID(id){
    return processes.find(p => p.id == id);
}

app.listen(port, () => console.log('Frontend online on port '+ port));

//INTERFAZ
app.get('/ping', (req, res) => res.send('pong!'));

app.post('/process', (req, res) => {
    try {
        var process = Object.setPrototypeOf(req.body, ProcessData.prototype);
        processes.push(process);
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

        http.get(process.getURL()+"/ping")
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
    const promises = processes.map( server => http.get(server.getURL()+"/ping"));
    Promise.all(promises).then(results => res.json(results.map(el => el.headers["x-server-name"]+':'+el.statusText)) );
});

app.post('/buyers',(req, res) => {
    var process = getProcessRandomly();
    var buyer = req.body
    addBuyer(process,buyer)
        .then(response => {
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
    var bidID = process.id +'-'+ uniqueIDGenerator.getUID();
    var bid = new Bid(bidID,req.body.tags,req.body.price,req.body.duration);
    
    http.post(process.getURL()+"/bids", bid)
        .then(response=>{
            res.send(response.data);
        })
        .catch(error => {
            res.status = 502;
            res.send(error.message);
        })    
});

app.post('/offer',(req, res) => {
    var offer = Object.setPrototypeOf(req.body, Offer.prototype);
    var process = getProcessByID(offer.bidID.split('-')[0]);
    http.post(process.getURL()+'/offer',offer)
        .then(response =>{
            res.send(response.data);
        })
        .catch(error => {
            res.status = 502;
            res.send(error.message);
        });
});

app.post('/bids-cancel',(req, res) => {
    var bidID = req.body.bidID;
    var process = getProcessByID(bidID.split('-')[0]);
    if (process == undefined){
        res.status = 502;
        res.send("No active bid for ID bidID");
    } else {
        http.post(process.getURL()+'/bids-cancel',req.body)
            .then(response =>{
                res.send(response.data);
            })
            .catch(error =>{
                res.status = 502;
                res.send(error.message);
            });
    }
})