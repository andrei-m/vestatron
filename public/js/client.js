var stocks = [];

function Stock(symbol, shares, grantDate) {
  this.symbol = symbol;
  this.shares = shares;
  this.grantDate = new Date(grantDate);

  this.vestedPercentage = function() {
    var today = new Date();
    // account for the 1 year cliff
    var timeSinceGrant = today.getTime() - this.grantDate.getTime();
    var daysSinceGrant = Math.floor(timeSinceGrant / 86400000);

    if (daysSinceGrant < 365) {
        return "0%";
    }

    var percentage = Math.floor(daysSinceGrant / 1460 * 100);
    return percentage.toString() + "%";
  }
}

// Remove the given Stock from DOM and data store
function removeStockElement(element) {
  if (confirm('Remove this stock?')) {
    var index = element.data('index');
    stocks.splice(index, 1);
    localStorage.setItem('stocks', JSON.stringify(stocks));
    element.remove(); 
  }
}

function renderStocks() {
  var container = $("#graphs");
  container.find("div").remove();

  for (var i=0 ; i < stocks.length; i++) {
    var stock = stocks[i];
    var unvested = $("<div></div>").data("index", i).addClass('unvested');;
    var vested = $("<div></div>").addClass('vested').css('width', stock.vestedPercentage()).html(stock.symbol);
    unvested.dblclick(function() {
        removeStockElement($(this))
        renderStocks();
    });
    unvested.append(vested);
    container.append(unvested);
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

