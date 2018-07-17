#!/bin/bash

buyer1 () {
	sleep 5
	node ./buyers/buyer.js 5000 juguetes,autos 508 &
}

buyer2 () {
	sleep 5
	node ./buyers/buyer.js 5001 juguetes,futbol 503 &
}

addBid() {
	sleep 20
	curl -X POST "http://127.0.0.1:4000/bids" -H "Content-Type: application/json" -d '{"tags":["juguetes","pokemon"], "price": 400, "duration": 50000,	"article":{"name":"Pikachu","size":"small"}}' 
	echo
}

# Ejecución
cd ..
npm start & buyer1 & buyer2 & addBid

wait