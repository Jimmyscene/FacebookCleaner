$(function() {
	chrome.storage.sync.get(
		["Name","Picture"]
	, function(results) {
		if(results["Picture"]){
			showUserData(results);
		}else{
			chrome.extension.getBackgroundPage().getUserInfo(function(args) {
				showUserData(args);
			});
		}
	});
	$("form").each(function() {
		$(this).submit(function(e) {
			handleSubmit(e.target);
			e.preventDefault(); 
		});
	});
function showUserData(results) {
	var profilePicture = $("<img/>", {
		"id" : "fbProfile",
		"class": "pull-left",
		"src" : results["Picture"]
	});
	var userName = $("<h4/>", {
		"text" : results["Name"]
	});
	$("#homerow").append(profilePicture).append(userName);
}


function showOptions(){

	var dateRange = $("<a/>", {
		"data-toggle" : "collapse",
		"id" : "dateRange",
		"text": "Delete posts between two dates",
		"href" : "#collapse" 
	}); 
}
function handleSubmit(form){
	chrome.storage.sync.get("access_token", function(results) {
		if(results["access_token"]){
			var baseURL = "https://graph.facebook.com/v2.5/me/posts/?fields=id& access token=" + results.access_token;
			switch(form.id){
				case "beforeForm":
					var beforeDate = new Date($("#beforeForm").children("input[type=date]")[0].value  + "T06:00:00").toDateString();
					baseURL += "&until=" + beforeDate;
					break;
				case "afterForm":
					var afterDate = new Date($("#afterForm").children("input[type=date]")[0].value + "T06:00:00").toDateString();
					baseURL += "&since=" + afterDate;
					break;
				case "rangeForm":
					var sinceDate = new Date($("#rangeForm").children("input#rangeFrom")[0].value + "T06:00:00").toDateString();
					var untilDate = new Date($("#rangeForm").children("input#rangeTo")[0].value + "T06:00:00").toDateString();
					baseURL += "&since=" + sinceDate + "&until=" + untilDate;
					break;
				default:
					return;	
			}
			iterateResponse([],baseURL,results.access_token);
		}
	});
	
	
}
function iterateResponse(arr, url,access_token){
	var loadingImg,loadingText;
	if(arr.length==0){
		$("#options").hide();
		loadingImg = $("<img/>")
			.attr( {'id' : 'loadingImg','src':'resources/ajax-loader.gif'} )
			.css({"display": "block","margin":"0 auto"});
		loadingText = $("<p/>")
			.attr("id","loadingText")
			.html("Loading. Please do not click off this window.")
			.css("text-align","center");
		$("body").append(loadingImg).append(loadingText);

	}
	$.get(url, function(response,status) {
		for (var i = response["data"].length - 1; i >= 0; i--) {
			var id = response["data"][i]["id"].split("_")[1];
			arr.push( id );
		}
		if( response.paging!= undefined){
			var next = response.paging["next"] + "&access token=" + access_token;
			iterateResponse(arr,next,access_token);
		}else{
			$("#loadingImg").remove();
			$("#loadingText").remove();
			showConfirmation(arr);
		}
	});
}
function showConfirmation(arr) {
	var container = $("<div/>")
		.addClass("well")
		.text("This will delete " + arr.length + " posts. Are you sure you want to continue?")
		.css({
			"margin-bottom":"0px",
			"display":"inline-block"
		})
	.append( 
		$("<button/>")
			.addClass('btn')
			.addClass('btn-danger')
			.html('Delete')
			.css({
				"display":"block",
				"margin":"5px"

			})
			.click(function() { 
				initiateDeletion(arr)
			})
		);
	$("body").append(container);
	 
}

function initiateDeletion(arr){
	$(".well").html("Deletion in progress. Feel free to use your browser, but do not use the Facebook page that just opened. It will alert you when finished.");
	chrome.extension.getBackgroundPage().setUpMessaging(arr);
}

});

// Status code 400 --  Possible expired TOken