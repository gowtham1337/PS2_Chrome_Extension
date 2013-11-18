var $linkstoprocess = Array();
var $errorlist = Array();

$( document ).ready(function() {
	console.log ("Script is loaded and ready to fire!");
	
	$( "#rightnext" ).prepend("<center><a class='myButton' id='processTableButton'>Update this page</a></center>");
	$("#processTableButton").bind("click", processTable)
	console.log ("Process button added");
	
	//Import styles
	var style = document.createElement('link');
	style.rel = 'stylesheet';
	style.type = 'text/css';
	style.href = chrome.extension.getURL('css/mystyles.css');
	(document.head||document.documentElement).appendChild(style);
	
	var style2 = document.createElement('link');
	style2.rel = 'stylesheet';
	style2.type = 'text/css';
	style2.href = chrome.extension.getURL('css/jquery.dataTables.css');
	(document.head||document.documentElement).appendChild(style2);
	
	var style3 = document.createElement('link');
	style3.rel = 'stylesheet';
	style3.type = 'text/css';
	style3.href = chrome.extension.getURL('css/TableTools.css');
	(document.head||document.documentElement).appendChild(style3);
	
});

function pad(num){
	return ("0" + num).slice(-2);
}

function processTable() {
    
	console.log ("Started processing the table");
	
	$("body").css('background','#fff');
	$("body").prepend('<div id="processed-data"><a style="float: left; display: none;" id="export-button" class="myButton">Export to Excel</a><table id="processed-table"><thead><tr><th>SNo</th><th>Name</th><th>City</th><th>Address</th><th>Stipend</th><th>Preferred Disciplines</th><th>Accomodation</th><th>Food</th><th>Transport</th><th>Website</th><th>Other Benefits</th><th>Problems</th></tr></thead><tbody></tbody></table></div>');
	$( "#export-button" ).bind( "click", function() {
		var m_names = new Array("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC");
		var d = new Date();
		
		var fileName = "PS2_Stations_Details_"+m_names[d.getMonth()]+"_"+pad(d.getDate())+"_"+pad(d.getHours())+pad(d.getMinutes())+".xls";
		exportToExcel(fileName);
		
		alert( "Downloaded Excel file named: "+fileName );
	});

	$("#processed-data").prepend("<p id='remaining-container'>Details of <span id='remaining-list'></span> PS stations are yet to be fetched</p>");
	$('#processed-table').dataTable({ "bPaginate": false, "sDom": 'T<"clear">lfrtip', "oTableTools": { "aButtons": [
				{
					"sExtends": "print",
					"sButtonText": "Print This Table"
				}
			] } });
	
	$data = $("#Table1 tr");
	$data = $data.slice(1);
	$data.each( function(i, row){
		var $row = $(row);
		
		$sno = $row.children("td").eq(0).children("font").html();
		
		$link = "http://www.bits-pilani.ac.in:12355/"+$row.children("td").eq(1).children("font").children("a").attr('href');
		
		$detail = $row.children("td").eq(1).children("font").children("a").html();
		var lastIndex = $detail.lastIndexOf(",")
		$name = $detail.substring(0, lastIndex);
		$city = $detail.substring(lastIndex + 1);
		
		$linkstoprocess.push([$sno,$link,$name,$city]);
		
	});
	$("#remaining-list").html($linkstoprocess.length);
	addToTable();					
}

function addToTable(){
//if ($linkstoprocess.length < 1) {$("#export-button").show();return;} //for testing
var requestData = $linkstoprocess.shift();
$sno=requestData[0];
$link=requestData[1];
$name=requestData[2];
$city=requestData[3];

$.get(
    $link,
    function(data) { 
	
    data = data.replace(/(html|head|body)/ig, '$1a');
	$dataTable1 = $(data).find('table').filter(function(){
		return $(this).css('width') == "600px";
	});
	$dataTable2 = $(data).find('table').filter(function(){
		return $(this).css('padding-left') == "50px";
	});
	
	
	if($dataTable1 !== undefined)
	{
		$address = $dataTable1.children("tbody").children("tr").eq(0).children("td").children("font").html() ;
		$stipend = $dataTable1.children("tbody").children("tr").eq(1).children("td").children("font").html() ;
		$pref_disc = $dataTable1.children("tbody").children("tr").eq(2).children("td").children("font").html() ;
		$acco = $dataTable1.children("tbody").children("tr").eq(3).children("td").children("font").html() ;
		$food = $dataTable1.children("tbody").children("tr").eq(4).children("td").children("font").html() ;
		$transport = $dataTable1.children("tbody").children("tr").eq(5).children("td").children("font").html() ;
		$website = $dataTable1.children("tbody").children("tr").eq(6).children("td").children("font").html() ;
		$other = $dataTable1.children("tbody").children("tr").eq(7).children("td").children("font").html() ;
	}
		
	if($dataTable2 !== undefined)
	{
		$problems = Array();
		$dataTable2.children("tbody").each(function(){
		var $this = $(this);
		var $problem = Array();
		var my_td = $this.children("tr").each(function(){
			var $inner_data = $(this);
			$problem.push($inner_data.children("th").children("font").html()+': '+$inner_data.children("td").children("font").html());
		});
			 
		$problems.push($problem.join('<br />'));	 
		});
	}
	
	$problems = $problems.join("<br /><br />");
	
    $('#processed-table').dataTable().fnAddData( [
		$sno,
		"<a href='"+$link+"' target='_blank'>"+$name+"</a>",
		$city,
		($address === undefined)?'-':$address,
		($stipend === undefined)?'-':$stipend,
		($pref_disc === undefined)?'-':$pref_disc,
		($acco === undefined)?'-':$acco,
		($food === undefined)?'-':$food,
		($transport === undefined)?'-':$transport,
		($website === undefined)?'-':$website,
		($other === undefined)?'-':$other,
		($problems === undefined)?'-':$problems] );
	
	},
    "html"
).fail(function(){ $('#processed-table').dataTable().fnAddData( [
		$sno,
		"<a href='"+$link+"' target='_blank'>"+$name+"</a>",
		$city,
		'-',
		'-',
		'-',
		'-',
		'-',
		'-',
		'-',
		'-',
		'-'] ); $errorlist.push([$sno,$link]);}).always(function(){ 
		if ($linkstoprocess.length > 0)
		{$("#remaining-list").html($linkstoprocess.length);
		addToTable();}
		else {
		
		//$("body").html( $("#processed-data").html() );
		$("#wrapper").hide();
		$("#export-button").show();
		
			if ($errorlist.length > 0)
				$("#remaining-container").html("Could not fetch details of PS stations: "+errorlisthtml()+". Check with the BITS website to see if details actually exist. Added their name and sno only. All other stations successfully updated.");
			else $("#remaining-container").html("Successfuly fetched details of all PS stations.");
		}
 });
		
}

function errorlisthtml(){
	var length = $errorlist.length,
    element = null;
	var string = "";
	for (var i = 0; i < length; i++) {
		element = $errorlist[i];
		string+= '<a href="'+element[1]+'" target="_blank">'+element[0]+'</a>, ';
	}
	string = string.substring(0,string.lastIndexOf(", "));
	
	return string;
}

//for excel export
var uri = 'data:application/vnd.ms-excel;base64,';
var template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>';

function base64(s) { return window.btoa(unescape(encodeURIComponent(s))); }
function format(s, c) { return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; }); }
   
function tableData(s){
s = s.replace(/<br \/>/g , "");
s = s.replace(/<br>/g , "\n");
return s;
}

function exportToExcel(fileName){
    table = document.getElementById("processed-table");
    var ctx = {worksheet: 'PS2 Stations', table: tableData(table.innerHTML)}
    var a = document.createElement('a');
	a.href     = uri + base64(format(template, ctx));
	a.target   = '_blank';
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	
}