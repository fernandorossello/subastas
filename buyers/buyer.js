const express = require('express');
const app = express();
const axios = require('axios');
const axiosRetry = require('axios-retry');
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const config = require('../config.json');
const Bid = require('../model/bid');
const Buyer = require('../model/buyer')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

marketPort = config.Frontend.port;
const port = process.argv[2];
const tags = process.argv[3];

function init(){
    suscribe();
}

function suscribe() {
    buyer = new Buyer(port,'http://127.0.0.1',port,tags);
    axios.post('http://127.0.0.1:'+ marketPort +'/buyers',buyer)
        .then(res => {
            console.log(res.data);
        })
        .catch(error => {
            console.log(error.message);
        })
}

init();

app.listen(port, () => console.log('Process online on port '+ port));

//INTERFAZ
app.post('/inbox', (req, res) => {        
    console.log(app.name + ": "+JSON.stringify(req.body));//
    res.send('ok');
});

