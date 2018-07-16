#!/bin/bash

curl -X POST "http://127.0.0.1:3000/kill" 
curl -X POST "http://127.0.0.1:4000/kill" 
curl -X POST "http://127.0.0.1:3001/kill" 
curl -X POST "http://127.0.0.1:3002/kill"
curl -X POST "http://127.0.0.1:3003/kill"
curl -X POST "http://127.0.0.1:3004/kill"
curl -X POST "http://127.0.0.1:5000/kill" 
curl -X POST "http://127.0.0.1:5001/kill" 
curl -X POST "http://127.0.0.1:5002/kill" 