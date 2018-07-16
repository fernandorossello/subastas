const express = require('express');
const app = express();
const axios = require('axios');
const axiosRetry = require('axios-retry');
axiosRetry(axios, { retries: 3, retryDelay: function (retryCount) { return retryCount*1000}});

const UniqueIDGenerator = require('../helpers/uniqueID')
const uniqueIDGenerator = new UniqueIDGenerator();

const config = require('../config.json');
const Bid = require('../model/bid');
const Buyer = require('../model/buyer')
const Offer = require('../model/offer')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

marketURL = 'http://127.0.0.1:'+config.Frontend.port;
const port = process.argv[2];
const tags = process.argv[3].split(',')
const maxPrice = process.argv[4]

const bids = []
const pendingOffers = []
var buyer;
const offeringDelay = 5000;

function init() {
    suscribe();
}

function suscribe() {
    buyer = new Buyer(port,'http://127.0.0.1',port,tags);
    axios.post(marketURL +'/buyers',buyer)
        .then(res => {
            console.log(res.data);
        })
        .catch(error => {
            console.log(error.message);
        })
}

init();

app.listen(port, () => console.log('Process online on port '+ port));

function offer(bid) {   
    var maxOffer = bid.currentMaxOffer()
    if ( (bidIsActive(bid)) && (!hasPendingOffer(bid)) && (maxPrice > maxOffer)) {
        newPrice = maxOffer+1;
        var uid = uniqueIDGenerator.getUID();
        var newOffer = new Offer(uid, buyer, bid.id, newPrice);
        pendingOffers.push(newOffer);
        setTimeout(function (){
            if(bidIsActive(bid)){
                console.log("\nOffering "+ newPrice + '. Bid: ' +bid.id);
                axios.post(marketURL+'/offer',newOffer)
                    .then(res => {
                        // Si la oferta fue rechazada, vuelvo a ofertar recursivamente.
                        var offerRes = res.data.offer;
                        if(res.data.bid != undefined){
                            var bidRes = Object.setPrototypeOf(res.data.bid, Bid.prototype);
                            if (offerRes.status == 'rejected'){
                                console.log("Offer rejected " + offerRes.price + '. Bid: ' +bid.id)
                                removePendingOffer(bidRes);
                                offer(bidRes);
                            } else {
                                console.log("Offer accepted " + offerRes.price + '. Bid: ' +bid.id)
                                removePendingOffer(bidRes);
                            }
                        }
                    })
                    .catch(error => {
                        console.log(error.message);
                    })
            }
        },offeringDelay);
    }
}

function hasPendingOffer(bid){
    return pendingOffers.some(o => o.bidID === bid.id);
}

function removePendingOffer(bid){
    var index = pendingOffers.findIndex(o => o.bidID === bid.id)
    if (index > -1) {
        pendingOffers.splice(index, 1);
    }
}

function bidIsActive(bid){
    return bids.some(b => b.id == bid.id);
}

function removeBid(bid){
    var index = bids.findIndex(b => b.id == bid.id);
    if (index > -1) {
        bids.splice(index, 1);
    }
}

//INTERFAZ
// Se indica la creación de una nueva subasta
app.put('/bids', (req, res) => {
    try{        
        console.log('New bid!')
        var bid = Object.setPrototypeOf(req.body, Bid.prototype);
        bids.push(bid);
        res.send();
    } catch(error) {
        res.status = 500;
        res.send(error.message);
    }
    offer(bid);
});

//Se indica un cambio en alguna subasta en la cual el buyer está interesado
app.post('/bids', (req, res) => {
    try{ 
        var bid = Object.setPrototypeOf(req.body, Bid.prototype);
        res.send();
        if((bidIsActive(bid)) && (!hasPendingOffer(bid))){
            console.log("\nBid changed "+bid.id+". New best price: "+ bid.currentMaxOffer());
            offer(bid);
        }
    } catch(error) {
        res.status = 500;
        res.send(error.message);
    }
});

// Se indica que una subasta se cerró
app.post('/bids-close', (req, res) => {
    try{ 
        var bid = Object.setPrototypeOf(req.body.bid, Bid.prototype);
        var message = req.body.message;
        removeBid(bid);
        console.log("\n" + message + ' Bid:' + bid.id);
        res.send();
    } catch(error) {
        res.status = 500;
        res.send(error.message);
    }
});

app.post('/kill',(req,res) => {
    res.send('Bye bye');
    console.log('Exiting process');
    process.exit(1);
  });
