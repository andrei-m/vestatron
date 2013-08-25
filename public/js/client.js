var stocks = [];

function Stock(symbol, shares, strikePrice, grantDate) {
  this.symbol = symbol;
  this.shares = shares;
  this.strikePrice = strikePrice;
  this.grantDate = new Date(grantDate);

  this.vestedRatio = function() {
    var today = new Date();
    // account for the 1 year cliff
    var timeSinceGrant = today.getTime() - this.grantDate.getTime();
    var daysSinceGrant = Math.floor(timeSinceGrant / 86400000);

    if (daysSinceGrant < 365) {
      return 0;
    }

    var ratio = daysSinceGrant / 1460;
    return ratio;
  };

  // if vested==true, return the value of the vested shares, otherwise return 
  // the overall (vested + unvested) value
  this.value = function(vested, cb) {
    var vestedShareCount = vested ? Math.floor(this.vestedRatio() * this.shares) : this.shares;
    var stock = this;

    if (this.sharePrice) {
      var value = (this.sharePrice - this.strikePrice) * vestedShareCount;
      cb(stock, value);
    } else {
      $.ajax("stock/" + this.symbol).done(function(data) {
        var sharePrice = parseFloat(data);
        stock.sharePrice = sharePrice;
        var value = (sharePrice - stock.strikePrice) * vestedShareCount;
        cb(stock, value);
      });
    }
  }
}

function renderStocks() {
  var container = $("#graphs");
  container.find("div").remove();

  for (var i=0 ; i < stocks.length; i++) {
    stocks[i].value(true, function(stock, value) {
      var unvested = $("<div class='unvested'></div>").data("stock", stock);
      var vestedPercentage = Math.floor(stock.vestedRatio() * 100).toString() + "%";
      var label = stock.symbol + " $" + value.toFixed(2);
      var vested = $("<div class='vested'></div>").css('width', vestedPercentage).html(label);
      unvested.append(vested);
      container.append(unvested);
    });
  };
}

$(function() {
    var loadedStocks = localStorage.getItem('stocks');

    if (loadedStocks) {
      var parsedStocks = JSON.parse(loadedStocks);

      // Invoke the constructor to make sure we get the methods the constructor defines
      for (var i=0; i < parsedStocks.length; i++) {
        stocks.push(new Stock(parsedStocks[i].symbol, 
          parsedStocks[i].shares, 
          parsedStocks[i].strikePrice,
          parsedStocks[i].grantDate));
      }
    
      renderStocks();
    }

    $('button#add').click(function() {
      var stock = new Stock($('input#symbol').val(),
                            parseInt($('input#shares').val()),
                            parseFloat($('input#strike_price').val()),
                            $('input#grant_date').val());
      $('input').val('');
      stocks.push(stock);
      localStorage.setItem("stocks", JSON.stringify(stocks));
      renderStocks();
    });

    $('button#clear').click(function() {
      stocks = [];
      localStorage.setItem("stocks", JSON.stringify(stocks));
      renderStocks();
    });
});

