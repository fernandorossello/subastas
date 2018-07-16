#!/bin/bash

buyer1 () {
	sleep 1
	ttab -a Iterm "node ./buyers/buyer.js 5000 juguetes,autos 508"
}

buyer2 () {
	sleep 2
	ttab -a Iterm "node ./buyers/buyer.js 5001 juguetes,futbol 503"
}

addBid() {
	sleep 15
	curl -X POST "http://127.0.0.1:4000/bids" -H "Content-Type: application/json" -d '{"tags":["juguetes","pokemon"], "price": 500, "duration": 50000,	"article":{"name":"Pikachu","size":"small"}}' 
	echo
}

buyer3 () {
	sleep 30
	ttab -a Iterm "node ./buyers/buyer.js 5002 juguetes,futbol 600"
}

# Ejecución
cd ..
npm start & buyer1 & buyer2 & addBid && buyer3

wait