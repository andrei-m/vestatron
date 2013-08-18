var stocks = [];

function Stock(symbol, shares, grantDate) {
  this.symbol = symbol;
  this.shares = shares;
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
    $.ajax("stock/" + this.symbol).done(function(data) {
      var sharePrice = parseFloat(data);
      cb(stock, sharePrice * vestedShareCount);
    });
  }
}

// Remove the given Stock from DOM and data store
function removeStockElement(element) {
  if (confirm('Remove this stock?')) {
    var index = element.data('index');
    stocks.splice(index, 1);
    localStorage.setItem('stocks', JSON.stringify(stocks));
    element.remove(); 
    renderStocks();
  }
}

function renderStocks() {
  var container = $("#graphs");
  container.find("div").remove();

  for (var i=0 ; i < stocks.length; i++) {
    stocks[i].value(function(stock, value) {
      var unvested = $("<div class='unvested'></div>").data("index", i);
      var vestedPercentage = Math.floor(stock.vestedRatio() * 100).toString() + "%";
      var label = stock.symbol + " $" + value.toFixed(2);
      var vested = $("<div class='vested'></div>").css('width', vestedPercentage).html(label);
      /*
      unvested.dblclick(function() {
        removeStockElement($(this))
      });
      */
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
        stocks.push(new Stock(parsedStocks[i].symbol, parsedStocks[i].shares, parsedStocks[i].grantDate));
      }
    }
    renderStocks();

    $('button#add').click(function() {
      var stock = new Stock($('input#symbol').val(),
                            $('input#shares').val(),
                            $('input#grant_date').val());
      $('input').val('');
      stocks.push(stock);
      localStorage.setItem("stocks", JSON.stringify(stocks));
      renderStocks();
    });
});

