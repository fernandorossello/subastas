const express = require('express');
const app = express();

var memory;

const port = process.argv[2];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => console.log('Replica online on port '+ port));

//INTERFAZ
app.get('/ping', (req, res) => res.send('pong!'));

app.post('/set',(req,res) => {
    var mem = req.body;
    memory = mem;
    res.send();
})

app.get('/get',(req, res) => {
    res.send(memory);
});
