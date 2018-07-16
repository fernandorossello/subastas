#!/bin/bash

buyer1 () {
	sleep 1
	ttab -a Iterm "node ./buyers/buyer.js 5000 juguetes,autos 508"
}

buyer2 () {
	sleep 2
	ttab -a Iterm "node ./buyers/buyer.js 5001 juguetes,futbol 503"
}

addBids() {
	sleep 15
	curl -X POST "http://127.0.0.1:4000/bids" -H "Content-Type: application/json" -d '{"tags":["juguetes","pokemon"], "price": 400, "duration": 120000,	"article":{"name":"Pikachu","size":"small"}}'
	echo
	sleep 10
	curl -X POST "http://127.0.0.1:4000/bids" -H "Content-Type: application/json" -d '{"tags":["juguetes","simpsons"], "price": 100, "duration": 40000,	"article":{"name":"Homero","size":"small"}}'
	echo
	curl -X POST "http://127.0.0.1:4000/bids" -H "Content-Type: application/json" -d '{"tags":["futbol"], "price": 0, "duration": 5000,	"article":{"name":"Pelota","size":"Nro 5"}}'
	echo
	curl -X POST "http://127.0.0.1:4000/bids" -H "Content-Type: application/json" -d '{"tags":["juguetes"], "price": 400, "duration": 100000,	"article":{"name":"Power ranger","size":"small"}}' 
	echo
}

# Ejecución
cd ..
npm start & buyer1 & buyer2 & addBids

wait