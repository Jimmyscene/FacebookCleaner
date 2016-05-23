$(function() {
	$("form").each(function() {
		$(this).submit(function(e) {
			handleSubmit(e.target);
			e.preventDefault(); 
		});
	});
	var initialHtml = "<html>"  + $("html").html() + "</html>";
	
	initPopup();


function initPopup(results) {
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
	
}

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

function handleSubmit(form){
	chrome.storage.sync.get("access_token", function(results) {
		if(results["access_token"]){
			var baseURL = "https://graph.facebook.com/v2.5/me/posts/?fields=story,message,type,id,status_type& access token=" + results.access_token;
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
			iterateResponse("",baseURL,results.access_token);
		}
	});
	
	
}
function iterateResponse(arr, url,access_token){
	var loadingImg,loadingText,loadingShown;
	if(arr === ""){
		$("#options").hide();
		loadingImg = $("<img/>")
			.attr( {'id' : 'loadingImg','src':'resources/ajax-loader.gif'} )
			.css({"display": "block","margin":"0 auto"});
		loadingText = $("<p/>")
			.attr("id","loadingText")
			.html("Loading. Please do not click off this window.")
			.css("text-align","center");
		$("body").append(loadingImg).append(loadingText);
		arr = new Array();

	}
	$.get(url, function(response,status) {
		for (var i = response["data"].length - 1; i >= 0; i--) {
			if( ! ((response["data"][i]["status_type"] == "added_photos") || ( response["data"][i]["type"] == "video" && response["data"][i]["story"]!=undefined && response["data"][i]["story"].indexOf("tagged")>0 )) ){
				var id = response["data"][i]["id"].split("_")[1];
				arr.push( id );
			}
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
	if(arr.length>0){
		var container = $("<div/>")
			.addClass("well")
			.attr({
					"id" : "container"
				})
			.text("This will delete " + arr.length + " posts. Are you sure you want to continue?")
			.css({
				"margin-bottom":"0px",
				"display":"inline-block"
			})
		.append("<br/>")
		.append( 
			$("<button/>")
				.addClass('btn')
				.addClass('btn-danger')
				.html('Delete')
				.css({
					"display":"inline-block	",
					"margin":"5px"

				})
				.click(function() { 
					initiateDeletion(arr)
				})
			)
		.append(
			$("<button/>")
				.addClass('btn')
				.addClass('btn-primary')
				.addClass('pull-right')
				.html('Cancel')
				.css({
					"display":"inline-block	",
					"margin":"5px"

				})
				.click(function() { 
					$("#options").show();
					$("#container").remove();
				})
			);
		$("body").append(container);
	}else{

		var container = $("<div/>")
			.addClass("well")
			.text("There are no posts in this range.")
			.css({
				"margin-bottom":"0px",
				"display":"inline-block",
				"width": "300px",
				"text-align": "Center"
			}).appendTo($("body"));
	}
}

function initiateDeletion(arr){
	$(".well").html("Deletion in progress. Feel free to use your browser, but do not use the Facebook page that just opened. It will alert you when finished.");
	chrome.extension.getBackgroundPage().setUpMessaging(arr);
	

	$("<div/>").addClass("progress")
		.append(
			$("<div/>")
			.addClass("progress-bar")
			.width("0%")
			.attr({
				"id" : "successProgress",
				"role":"progressBar",
				"aria-valuenow":"0",
				"aria-valuemin":"0",
				"aria-valuemax":arr.length
			})
			.text("0%")).append(
				$("<div/>")
				.addClass("progress-bar")
				.addClass('progress-bar-danger')
				.width("0%")
				.attr({
					"id" : "failedProgress",
					"role":"progressBar",
					"aria-valuenow":"0",
					"aria-valuemin":"0",
					"aria-valuemax":arr.length
				}).text("")).appendTo($(".well"));

		var interval = setInterval(function() {
			var percent  = Math.round( 100 *(localStorage.success+localStorage.failed) /arr.length);
			var successPercent = Math.round( 100 *localStorage.success /arr.length);
			var failedPercent = Math.round( 100 *localStorage.failed /arr.length);

			$("#successProgress")
				.width(successPercent+"%")
				.text(successPercent+"%")
				.attr("aria-valuenow",successPercent);
			$("#failedProgress")
				.width(failedPercent+"%")
				.attr("aria-valuenow",failedPercent);


			if(percent==100){
				clearInterval(interval);
			}
		}, 400);
}

});

// Status code 400 --  Possible expired TOken

// 6-1-13
/*

Object {message: "http://www.youtube.com/watch?v=mUIEJvPY20w", type: "video", id: "10153761057286893_528268030558255", status_type: "shared_story"}
Object {message: "This.", type: "link", id: "10153761057286893_135181349997017", status_type: "shared_story"}
Object {type: "link", id: "10153761057286893_527129340670464", status_type: "shared_story"}
Object {type: "video", id: "10153761057286893_10151578930206893", status_type: "shared_story"}
Object {type: "video", id: "10153761057286893_10150357231496893"}
Object {type: "video", id: "10153761057286893_10150280477881893"}
Object {type: "video", id: "10153761057286893_10150165877346893"}



Can't delete "added_photos"

Can't delete video story=="%USER% was tagged in a video "
CAN DELETE video story == "shared_story"
CAN DELETE link story == "%USER% added a life event"

*/