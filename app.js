var express = require('express'),
    request = require('request');

var app = express();
app.use(express.static(__dirname + '/public'));

app.get('/stock/:symbol', function (req, res) {
    getPrice(req.params.symbol, function(price) {
      if (price.error) {
        res.send(500, price.error);
      } else {
        res.send(200, price);
      }
    });
});

// Get the latest stock price from Yahoo
function getPrice(symbol, cb) {
  console.log('Fetching price for ' + symbol);
  request('http://finance.yahoo.com/d/quotes.csv?f=b2&s=' + symbol, function(error, response, price) {
      if (!error && response.statusCode == 200) {
        console.log(symbol + ':' + price);
        cb(price);
      } else {
        console.log('an error occurred: ' + e);
        cb({'error': error});  
      }
  });
}

app.listen(8891);
console.log('listening on port 8891');
