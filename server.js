var express = require('express')
var app = express();

app.get('/', function (req, res) {
  res.send('Hello World')
});


app.get('/api/empleados', function (req, res) {
  var empleados = [
  {id: 123, nombre: "Jose"},
  {id: 567, nombre: "Pedro"}
  ];
  res.setHeader('Content-Type', 'application/json');
  res.send(empleados);
});

app.listen(3000);