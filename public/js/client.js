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

  this.value = function(cb) {
    var vestedShareCount = Math.floor(this.vestedRatio() * this.shares);
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

  // This function only returns a value once the callback in 'value()' has set a sharePrice
  this.potentialValue = function() {
    if (this.sharePrice) {
      return (this.sharePrice - this.strikePrice) * this.shares;
    } else {
      return 0;
    }
  }
}

function renderStocks() {
  var unvestedDivs = {};

  // Convert a ratio between {0,1} to a CSS-frienndly percentage
  function ratioToPercent(ratio) {
    return Math.floor(ratio * 100).toString() + "%";
  }

  // Scale the unvested div widths according to the max value 
  // (i.e. the most valuable stock = 100%; everything else is less wide)
  function scaleForMaxValue(unvestedDiv, stock) {
    unvestedDivs[JSON.stringify(stock)] = unvestedDiv;

    // Start scaling once the last div is processed
    if (Object.keys(unvestedDivs).length == stocks.length) {
      var maxValue = 0;

      for (key in unvestedDivs) {
        var div = unvestedDivs[key];
        var stock = div.data("stock");
        maxValue = Math.max(maxValue, stock.potentialValue());
      }

      for (key in unvestedDivs) {
        var div = unvestedDivs[key];
        var stock = div.data("stock");
        var ratio = stock.potentialValue() / maxValue;
        div.css('width', ratioToPercent(ratio));
      }
    }
  }

  var container = $("#graphs");
  container.find("div").remove();

  for (var i=0 ; i < stocks.length; i++) {
    stocks[i].value(function(stock, value) {
      var unvested = $("<div class='unvested'></div>").data("stock", stock);
      var vestedPercentage = ratioToPercent(stock.vestedRatio());
      var label = stock.symbol + " $" + value.toFixed(2);
      var vested = $("<div class='vested'></div>").css('width', vestedPercentage).html(label);
      unvested.append(vested);
      container.append(unvested);
      scaleForMaxValue(unvested, stock);
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

