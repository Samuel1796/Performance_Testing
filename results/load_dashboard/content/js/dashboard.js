/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 99.14285714285714, "KoPercent": 0.8571428571428571};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.6725, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.95, 500, 1500, "POST - Browse Category (Phones)"], "isController": false}, {"data": [0.45, 500, 1500, "GET - Home Page"], "isController": false}, {"data": [0.93, 500, 1500, "POST - Add to Cart"], "isController": false}, {"data": [0.49, 500, 1500, "POST - User Login"], "isController": false}, {"data": [0.91, 500, 1500, "GET - View Cart Page"], "isController": false}, {"data": [0.0, 500, 1500, "TX - Full Purchase Flow"], "isController": true}, {"data": [0.71, 500, 1500, "GET - Product Details Page"], "isController": false}, {"data": [0.94, 500, 1500, "POST - Checkout (Delete Cart)"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 350, 3, 0.8571428571428571, 605.0085714285715, 260, 3054, 449.0, 943.6000000000001, 1198.85, 1963.4300000000037, 4.927009868096907, 29.7768735394935, 1.2757436265608062], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["POST - Browse Category (Phones)", 50, 0, 0.0, 432.3400000000001, 383, 687, 408.5, 531.5999999999999, 623.8, 687.0, 0.9355237061707145, 1.9669751361186993, 0.24210330286644466], "isController": false}, {"data": ["GET - Home Page", 50, 3, 6.0, 1040.3799999999999, 670, 3054, 882.0, 1678.5999999999997, 2215.0999999999995, 3054.0, 1.0310341272296113, 9.333758634910817, 0.23560740798020416], "isController": false}, {"data": ["POST - Add to Cart", 50, 0, 0.0, 448.1399999999999, 374, 913, 405.0, 603.5999999999999, 855.1999999999996, 913.0, 0.9099181073703367, 0.23473043676069152, 0.27368630573248404], "isController": false}, {"data": ["POST - User Login", 50, 0, 0.0, 937.5400000000001, 781, 1586, 851.0, 1249.3, 1372.6499999999999, 1586.0, 1.0102234614296683, 0.24570923369499334, 0.2939908120176183], "isController": false}, {"data": ["GET - View Cart Page", 50, 0, 0.0, 418.76, 260, 969, 390.0, 617.8, 809.249999999999, 969.0, 0.858089206953955, 9.561208709819972, 0.19524881369167138], "isController": false}, {"data": ["TX - Full Purchase Flow", 50, 3, 6.0, 4235.06, 3544, 6489, 4104.0, 4850.8, 5781.199999999998, 6489.0, 0.9338114447930674, 39.50507555701853, 1.6925332436874347], "isController": true}, {"data": ["GET - Product Details Page", 50, 0, 0.0, 517.68, 331, 918, 523.5, 631.8, 719.9, 918.0, 0.9211835366078337, 17.783340223018534, 0.21590239139246103], "isController": false}, {"data": ["POST - Checkout (Delete Cart)", 50, 0, 0.0, 440.22, 381, 863, 406.0, 565.0999999999999, 722.8499999999992, 863.0, 0.8935272883233855, 0.1798921735944816, 0.2425786974159191], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["The operation lasted too long: It took 2,269 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 33.333333333333336, 0.2857142857142857], "isController": false}, {"data": ["The operation lasted too long: It took 2,171 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 33.333333333333336, 0.2857142857142857], "isController": false}, {"data": ["The operation lasted too long: It took 3,054 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 33.333333333333336, 0.2857142857142857], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 350, 3, "The operation lasted too long: It took 2,269 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 2,171 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 3,054 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": ["GET - Home Page", 50, 3, "The operation lasted too long: It took 2,269 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 2,171 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 3,054 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
