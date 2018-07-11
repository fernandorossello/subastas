const express = require('express');
const config = require('./config.json');

const app = express();
const port = config.Supervisor.port;

app.use(express.json() );
app.use(express.urlencoded({ extended: true }));


app.get('/ping', (req, res) => res.send('pong!'));



app.listen(port, () => console.log('Market listening on port '+ port));
