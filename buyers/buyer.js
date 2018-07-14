const express = require('express');
const app = express();
const axios = require('axios');
const axiosRetry = require('axios-retry');
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

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
var buyer;

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
    if (maxPrice > maxOffer) {
        newPrice = maxOffer+1
        var newOffer = new Offer(buyer, bid.id, newPrice);
        console.log("Offering "+ newPrice)
        axios.post(marketURL+'/offer',newOffer)
            .then(res => {
                // Si la oferta fue rechazada, vuelvo a ofertar recursivamente.
                var offerRes = res.data.offer;
                if (offerRes.status == 'rejected'){
                    console.log("Offer rejected")
                    var bidRes = Object.setPrototypeOf(res.data.bid, Bid.prototype);
                    offer(bidRes);
                }
            })
            .catch(error => {
                console.log(error.message);
            })
    }
}

//INTERFAZ
app.put('/bids', (req, res) => {
    try{        
        console.log('New bid!')
        var bid = Object.setPrototypeOf(req.body, Bid.prototype);
        bids.push(bid);
        res.send();
        offer(bid);
    } catch(error) {
        res.status = 502;
        res.send(error.message);
    }
});

