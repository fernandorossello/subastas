const express = require('express');
const app = express();

const axios = require('axios');
const axiosRetry = require('axios-retry');
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const Bid = require('./model/bid');

const port = process.argv[2];
const replicaPort = process.argv[3];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const Memory = require('./memory.js')
var memory = new Memory();

var buyers = [];

app.use(function(req, res, next) {
    res.set('X-Server-Name',"process_"+port);
    next();
  });

function replicate() {
  return axios.post("http://localhost:"+ replicaPort +"/memory", memory);
}

app.listen(port, () => console.log('Process online on port '+ port));

//INTERFAZ
app.post('/buyers',(req, res) => {
  try{
    buyers.push(req.body);
    res.send('Buyer created!')
  } catch(error) {
    res.status = 502;
    res.send(error.message);
  }
});

app.get('buyers',(req, res) => {
    res.send(buyers);
});

app.get('/ping', (req, res) => res.send('pong!'));

app.post('/bids',(req, res) => {
  try{
    var bid = Object.setPrototypeOf(req.body, Bid.prototype);
    memory.addBid(bid);
    replicate()
    .then(() => {
      res.send("Bid added!");
    });
  } catch(error) {
    res.status = 502;
    res.send(error.message);
  }
});

app.get('/memory',(req, res) => {
  res.send(memory);
});

app.post('/memory',(req,res) => {
  var mem = req.body;
  memory = Object.setPrototypeOf(req.body, Memory.prototype);
  res.send();
})


