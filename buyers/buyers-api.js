const express = require('express');
const axios = require('axios');
const axiosRetry = require('axios-retry');

const config = require('../config.json');
const Bid = require('../model/bid');
const Buyer = require('../model/buyer')
const Offer = require('../model/offer')

const UniqueIDGenerator = require('../helpers/uniqueID')
const uniqueIDGenerator = new UniqueIDGenerator();

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

marketURL = 'http://127.0.0.1:'+config.Frontend.port;
const app = express();

const port = process.argv[2] || 4005;

const buyers = [];

app.use(express.json() );
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => console.log('Api buyers online on port '+ port));

//INTERFAZ
app.get('/ping', (req, res) => res.send('pong!'));

app.post('/buyer', (req, res) => {
    try {
        var buyer = Object.setPrototypeOf(req.body, Buyer.prototype);        
        buyer.strategy = req.body.strategy;
        buyers.push(buyer);
        startBuyer(buyer);
        res.send('Agregado!');
    } catch(error) {
        res.statusCode = 500;
        res.send(error.data)
    }
});

function startBuyer(buyer) {
    const appBuyer = express();

    const port = buyer.port;

    axios.post(marketURL +'/buyers',buyer)
        .then(res => {
            console.log(res.data);
        })
        .catch(error => {
            console.log(error.message);
        });

    buyer.bids = [];
    buyer.pendingOffers = [];

    appBuyer.use(express.json() );
    appBuyer.use(express.urlencoded({ extended: true }));
    appBuyer.listen(port, () => console.log('Buyer online on port '+ port));

   
    
    //INTERFAZ
    // Se indica la creación de una nueva subasta
    appBuyer.put('/bids', (req, res) => {
        try{        
            console.log('[buyer ' + buyer.port +']: New bid!');
            var bid = Object.setPrototypeOf(req.body, Bid.prototype);            
            buyer.bids.push(bid);            
            res.send();
        } catch(error) {
            res.status = 500;
            res.send(error.message);
        }
        offer(bid,buyer);
    });
    
    //Se indica un cambio en alguna subasta en la cual el buyer está interesado
    appBuyer.post('/bids', (req, res) => {
        try{ 
            var bid = Object.setPrototypeOf(req.body, Bid.prototype);
            console.log('[buyer ' + buyer.port +']: Bid changed. New best price:', bid.currentMaxOffer());
            res.send();
            offer(bid,buyer);
        } catch(error) {
            res.status = 500;
            res.send(error.message);
        }
    });
    
    // Se indica que una subasta se cerró
    appBuyer.post('/bids-close', (req, res) => {
        try{ 
            var bid = Object.setPrototypeOf(req.body.bid, Bid.prototype);
            var message = req.body.message;
            removeBid(bid,buyer);
            console.log('[buyer ' + buyer.port +']: '+ message + ' Bid:' + bid.id);
            res.send();
        } catch(error) {
            res.status = 500;
            res.send(error.message);
        }
    });
}
app.get('/buyers',(req,res) => {
    res.json(buyers);    
  });

 app.post('/kill',(req,res) => {
    res.send('Bye bye');
    console.log('Exiting buyer');
    process.exit(1);
  });

  function offer(bid,buyer) {   
    var maxOffer = bid.currentMaxOffer()
    if ( (bidIsActive(bid,buyer)) && (!hasPendingOffer(bid,buyer)) && (buyer.strategy.maxPrice > maxOffer) && ( buyer.strategy.ratioOffering >= Math.floor(100 * Math.random())+1 )) {
        newPrice = maxOffer+buyer.strategy.increment;
        var uid = uniqueIDGenerator.getUID();
        let buyerCloned = Object.assign({}, buyer);
        buyerCloned.pendingOffers = undefined;
        buyerCloned.strategy = undefined;
        var newOffer = new Offer(uid, buyerCloned, bid.id, newPrice);
        buyer.pendingOffers.push(newOffer);
        setTimeout(function (){
            console.log('[buyer ' + buyer.port +']: Offering '+ newPrice + ' ' + uid);            
            axios.post(marketURL+'/offer',newOffer)
                .then(res => {
                    // Si la oferta fue rechazada, vuelvo a ofertar recursivamente.
                    var offerRes = res.data.offer;
                    if(res.data.bid != undefined){
                        var bidRes = Object.setPrototypeOf(res.data.bid, Bid.prototype);
                        if (offerRes.status == 'rejected'){
                            console.log('[buyer ' + buyer.port +']: Offer rejected ' + offerRes.price + ' ' +uid)
                            removePendingOffer(bidRes,buyer);
                            offer(bidRes,buyer);
                        } else {
                            console.log('[buyer ' + buyer.port +']: Offer accepted ' + offerRes.price + ' ' +uid)
                            removePendingOffer(bidRes,buyer);
                        }
                    }
                })
                .catch(error => {                    
                    console.log(error.message);
                })
            },buyer.strategy.wait);
    }
}

function hasPendingOffer(bid,buyer){
    return buyer.pendingOffers.some(o => o.bidID === bid.id);
}

function removePendingOffer(bid,buyer){
    var index = buyer.pendingOffers.findIndex(o => o.bidID === bid.id)
    if (index > -1) {
        buyer.pendingOffers.splice(index, 1);
    }
}

function bidIsActive(bid,buyer){
    return buyer.bids.some(b => b.id == bid.id);
}

function removeBid(bid,buyer){
    var index = buyer.bids.findIndex(b => b.id == bid.id);
    if (index > -1) {
        buyer.bids.splice(index, 1);
    }
}
