/**
 * Script to calculate RSI (Relative strength index) and estimate price for a given RSI value.
 */

/**
 * Main function to estimate price for RSI.
 *
 * @param {String} ticker The ticker to lookup.
 * @param {String} lookback The RSI lookback.
 * @param {String} rsiLevel The RSI value to estimate price for.
 * @customfunction
 */
function RSI_ESTIMATE(ticker, lookback, rsiLevel) {  
  if (!ticker) {
    return "0";
  }
    
  ticker = ticker.trim();
  entries = getHistoricalPrices(ticker,15); // 15 day prices should suffice
  var last = getLastPrice(ticker);
  if (last != "0" && entries[entries.length-1] != last) {
    entries.push(last); 
  }
  
  // Iterate to find RSI
  var rsi = rsiCalculation(ticker,entries,lookback);  
   
  var index = entries.length-1;
  var count = 0;
  
  var change = 0.1;
  if (entries[index] < 50) {
    change = 0.05;
  }
  if (entries[index] < 15) {
    change = 0.02;
  }
  
  
  if (rsi < rsiLevel) {
    // Move up
    change = -change;
    while (rsi < rsiLevel) {      
      entries[index] -= change; // Use subtract with negative change
      rsi = rsiCalculation(ticker,entries,lookback);
      Logger.log(rsi + " for " + entries[index]);
      if (count++ > 200) {
        Logger.log("Too many iterations! "+ rsi +" still < "+rsiLevel);
        return "-1";
      }
    }
  } else {
    // Move down     
     while (rsi > rsiLevel) {      
          
      entries[index] -= change;
      
      rsi = rsiCalculation(ticker,entries,lookback);
      Logger.log(rsi + " for " + entries[index]);
      if (count++ > 200) {
        Logger.log("Too many iterations! "+ rsi + " still > "+rsiLevel);
        return "-1";
      }
    }
  }
  
  var calculatedPrice = +entries[index]
  Logger.log("rsi=" + rsi + " for " + calculatedPrice + " rsiLevel="+rsiLevel);
  
  return entries[index].toFixed(2);
}


/**
 * Main function for calculating RSI.
 *
 * @param {String} ticker The ticker to lookup.
 * @param {String} lookback The RSI lookback setting
 * @customfunction
 */
function RSI_CALC(ticker, lookback) {
  if (!ticker) {
    return "-1"; 
  }
  
  entries = myGetHistoricalStockInfo(ticker,15); // 15 days should suffice
  var last = getLastPrice(ticker);
  if (last != "0" && entries[entries.length-1] != last) {
    entries.push(last); 
  }
  
  return ""+rsiCalculation(ticker,entries,lookback);
}


/**
 * Calculate the RSI value.
 *
 * @param {String} ticker The ticker to lookup.
 * @param {Array} entries Array with prices.
 * @param {String} lookback The RSI lookback setting
 * @customfunction
 */
function rsiCalculation(ticker, entries, lookback) 
{
  var multiplier, rsU,rsD,upChanges,downChanges;
  var rsiEntries;
  
  rsiEntries = [];
  multiplier = lookback-1;
  rsU = 0;
  rsD = 0;
  upChanges = 0;
  downChanges = 0;
  
  // Init calculations
  for (var i = 0; i < lookback; i++) {
    var change = entries[lookback-i]-entries[lookback-i-1];

    if (change > 0) {
      upChanges += change;
    } else {
      downChanges += Math.abs(change); 
    }
    
    rsU = upChanges/lookback;
    rsD = downChanges/lookback;   
  }
  
  for (var i = lookback+1; i < entries.length; i++) {
    var change = entries[i] - entries[i-1];    
    upChanges = 0;
    downChanges = 0;
    if (change >0) {
      upChanges = change;
    } else {
      downChanges = Math.abs(change);
    }
    
    rsU = (rsU*multiplier)+upChanges;
    rsD = (rsD*multiplier)+downChanges;
    rsU = rsU / lookback;
    rsD = rsD / lookback;
    
    var rs = 0;
    if (rsD > 0) {
      rs = rsU/rsD; 
    } 
    var rsi = 100-(100/(1+rs));
    rsiEntries.push(rsi);  
  }
  
  Logger.log("RSI:"+rsiEntries[rsiEntries.length-1]);  
  return rsiEntries[rsiEntries.length-1];
}

/**
 * Find last traded price for ticker.
 *
 * @param {String} ticker The ticker.
 * @customfunction
 */
function getLastPrice(ticker) {  
  var url = "http://finance.google.com/finance/info?client=ig&q="+ticker;

  var data = UrlFetchApp.fetch(url);  
  var contentLines = data.getContentText();
 
  if (contentLines) {
    var data = JSON.parse(cleanContent(contentLines));
    Logger.log("Fetched latest for " + ticker +": "+data['l_cur']);
    return data['l_cur'];
  }
  
  return "0";
}


/**
 * Clean string for JSON parsing.
 * Example string:
 * '// [ { "id": "17825824227019" ,"t" : "ASSA-B" ,"e" : "STO" ,"l" : "159.60" ,"l_fix" : "159.60" ,"l_cur" : "SEK159.60" ,"s": "0" ,"ltt":"11:53AM GMT+2" ,"lt" : "Jun 29, 11:53AM GMT+2" ,"lt_dts" : "2015-06-29T11:53:42Z" ,"c" : "-2.90" ,"c_fix" : "-2.90" ,"cp" : "-1.78" ,"cp_fix" : "-1.78" ,"ccol" : "chr" ,"pcls_fix" : "162.5" } ]'
 *
 * @param {String} text The string
 * @customfunction
 */
function cleanContent(text) {
  return text.substring(text.indexOf("[")+1,text.lastIndexOf("]"));
}


/**
* Get daily prices for symbol
*
* @param {String} ticker The ticker.
* @param {String} days The number of days to fetch.
* @customfunction
*/
function getHistoricalPrices(ticker,days)
{ 
  var data = UrlFetchApp.fetch("http://www.google.com/finance/getprices?i=86400&p="+days+"d&f=c&q="+ticker);
  var entries = [];
  var contentLines = data.getContentText().split("\n");
  
  if (contentLines) {
    for (var i = 0; i < days-2; i++) {      
      var close = contentLines[contentLines.length-2-i];
      entries.push(close);            
    }
  }
  entries = entries.reverse();
  
  Logger.log("Fetched " + entries.length + " historical prices");
  return entries;
}
