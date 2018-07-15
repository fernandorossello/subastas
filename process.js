const express = require('express');
const app = express();

const axios = require('axios');
const axiosRetry = require('axios-retry');
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const Bid = require('./model/bid');
const Buyer = require('./model/buyer')
const Offer = require('./model/offer')

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

function checkExpiredBids(){
  memory.bids
    .filter(b => b.isExpired())
    .forEach(b => {
      memory.closeBid(b.id);
      console.log("Bid expired. " + b.id);
      buyers
        .filter(bu => bu.isInterested(b.tags))
        .forEach(bu => {
          var message;
          if ((b.maxOffer != undefined) && (bu.name == b.maxOffer.buyer.name)){
              message = 'You won the bid.';   
          } else {
              message = 'You lost the bid.';
          }
          axios.post(bu.url()+'/bids-close',{bid:b,message:message})
            .catch(error => console.log(error.message));
        });
        replicate();
    });

    setTimeout(checkExpiredBids,500);
}

// Notifica a los compradores con tags en común, que hay una nueva subasta disponible.
function notifyNewBid(bid){
  buyers
    .filter(b => b.isInterested(bid.tags))
    .forEach(b => {
      axios.put(b.url()+'/bids',bid);
    });
}

// Notifica a los compradores con tags en común, que hay una nueva oferta ganadora en una subasta.
function notifyOthersInterested(bid){
  buyers
    .filter(b => b.isInterested(bid.tags) && b.name != bid.winningBuyer().name)
    .forEach(b => {
      axios.post(b.url()+'/bids',bid)
      .catch(error =>{
        console.log(errror.message)
      });
    })
};

function init(){
    setTimeout(checkExpiredBids,500);
}

init();

app.listen(port, () => console.log('Process online on port '+ port));

//INTERFAZ
app.get('/ping', (req, res) => res.send('pong!'));

app.post('/buyers',(req, res) => {
  try{
    buyer = Object.setPrototypeOf(req.body, Buyer.prototype);
    buyers.push(buyer);
    res.send('Buyer created!')
  } catch(error) {
    res.status = 502;
    res.send(error.message);
  }
});

app.get('/buyers',(req, res) => {
    res.send(buyers);
});

app.post('/bids',(req, res) => {
  try{
    var bid = Object.setPrototypeOf(req.body, Bid.prototype);
    memory.addBid(bid);
    replicate()
    .then(() => {
      res.send("Bid added!");
      notifyNewBid(bid);
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
});

app.post('/offer',(req,res) => {
  var offer = Object.setPrototypeOf(req.body, Offer.prototype);
  var bid = memory.getBidById(offer.bidID);
  if (offer.price > bid.currentMaxOffer()) {
    offer.status = "accepted"
    bid.maxOffer = offer;
    replicate();
    notifyOthersInterested(bid);
  } else {
    offer.status = "rejected"
  }
  res.send(JSON.stringify({offer:offer, bid:bid}))
});
