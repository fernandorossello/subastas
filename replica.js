const express = require('express');
const app = express();

const Memory = require('./memory.js')

const memory = new Memory();

const port = process.argv[2];

app.listen(port, () => console.log('Replica online on port '+ port));