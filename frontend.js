const express = require('express');
const axios = require('axios');
const config = require('./config.json');
const axiosRetry = require('axios-retry');

const Bid = require('./model/bid');
const Offer = require('./model/offer');
const ProcessData = require('./model/process-data');

const http = axios.create();
http.interceptors.response.use(
    res => {
      return res;
    },
    error => {
  
      return Promise.reject(error.response)
    }
  );
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
        res.statusCode = 500;
        res.send(error.data)
    }
});

app.get('/process', (req, res) => {
    try {
        res.send(processes);
    } catch(error) {
        res.statusCode = 500;
        res.send(error.data)
    }
});

app.delete('/process/:pid', (req, res) => {
    try {
        var index = processes.findIndex(p => p.id == req.params.pid);
        processes.splice(index,1);
        res.send();
    } catch(error) {
        res.statusCode = 500;
        res.send(error.message)
    }
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
                .filter(p => p.id != process.id)
                .forEach(p => { 
                    addBuyer(p,buyer)});
        })
        .catch(error => {
            res.statusCode = 500;
            res.send(error.message);
        })
});

app.post('/bids',(req, res) => {
    
    var bid = new Bid(req.body.tags,req.body.price,req.body.duration);
    
    distributeBid(bid)
        .then(response => {
            res.send(response.data);
        })
        .catch(error =>{
            res.statusCode = error.status;
            res.send(error.data);
        })
});

function distributeBid(bid) {
    return new Promise(function(resolve, reject) {
        var process = getProcessRandomly();
        bid.id = process.id +'-'+ uniqueIDGenerator.getUID();
        http.post(process.getURL()+"/bids", bid)
            .then(response =>{
                resolve(response);
            })
            .catch(error => {
                if (error.status == 503) {
                    distributeBid(bid)
                        .then(response => {
                            resolve(response);
                        });
                } else {
                    reject(error.data);
                }           
            });
    });
}

app.post('/offer',(req, res) => {
    var offer = Object.setPrototypeOf(req.body, Offer.prototype);
    var process = getProcessByID(offer.bidID.split('-')[0]);
    http.post(process.getURL()+'/offer',offer)
        .then(response =>{
            res.send(response.data);
        })
        .catch(error => {
            res.statusCode = 500;
            res.send(error.data);
        });
});

app.post('/bids-cancel',(req, res) => {
    var bidID = req.body.bidID;
    var process = getProcessByID(bidID.split('-')[0]);
    if (process == undefined){
        res.statusCode = 500;
        res.send("No active bid for ID bidID");
    } else {
        http.post(process.getURL()+'/bids-cancel',req.body)
            .then(response =>{
                res.send(response.data);
            })
            .catch(error =>{
                res.statusCode = 500;
                res.send(error.data);
            });
    }
})

app.post('/kill',(req,res) => {
    res.send('Bye bye');
    console.log('Exiting process');
    process.exit(1);
  });