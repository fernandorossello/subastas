const express = require('express');
const app = express();

const port = process.argv[2];
const replicPort = process.argv[3];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var buyers = [];

app.use(function(req, res, next) {
    res.set('X-Server-Name',"process_"+port);
    next();
  });


app.listen(port, () => console.log('Process online on port '+ port));

//INTERFAZ
app.post('/buyers',(req, res) => {
  try{
    buyers.push(req.body);
    res.send('Buyer created!')
  } catch(error) {
    res.status = 502;
    res.send(error.message);
  }
});

app.get('/buyers-list',(req, res) => {
    res.send(buyers);
});

app.get('/ping', (req, res) => res.send('pong!'));

app.post('/bids')

