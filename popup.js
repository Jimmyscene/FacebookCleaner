$(function() {

	$("form").each(function() {
		$(this).submit(function(e) {
			handleSubmit(e.target);
			e.preventDefault(); 
		});
	});

	var initialHtml = "<html>"  + $("html").html() + "</html>";
	
	initPopup();

function showData(results) {
	if(results['Picture']) {
		showUserData(results);
	} else {
		chrome.extension.getBackgroundPage().getUserInfo(function(args) {
			showUserData(args);
		});
	}
}
function initPopup(results) {
	chrome.storage.sync.get(
		["Name","Picture"]
	, showData
	);
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
function getDateStr(element,children) {
	return new Date( $(element).children(children)[0].value + "T06:00:00").toDateString();
}
function appendTag(url,tag,val) {
	url += "&"+tag+"="+val;
	return url;
}

function appendSinceTag(url) {
	var beforeDate = getDateStr("#beforeForm","input[type=date]");
	return appendTag(url,"until",beforeDate);
}

function appendFromTag(url) {
	var afterDate = getDateStr("#afterForm","input[type=date]");
	return appendTag(url,"since",afterDate);
}

function appendRangeFromTag(url) {
	var sinceDate = getDateStr("#rangeForm","input#rangeForm");
	var untilDate = getDateStr("#rangeForm","input#rangeTo");

	url += appendTag(url,"since",sinceDate);
	url + appendTag(url,"until",untilDate);
	return url;
}

function appendDateRange(url,form) {
	if (form.id == 'beforeForm')
		url = appendSinceTag(url);
	else if (form.id == 'afterForm')
		url = appendFromTag(url);
	else if (form.id == 'rangeForm')
		url = appendRangeFromTag(url);

	return url;
}

function handleSubmit(form){
	truncatedUrl = "https://graph.facebook.com/v2.5/me/posts/?fields=story,message,type,id,status_type& access token=";
	chrome.storage.sync.get("access_token", function(results) {
		if ( results["access_token"] ) {
			var baseURL = truncatedUrl + results.access_token;

			baseUrl = appendDateRange(baseUrl, form);

			iterateResponse("",baseURL,results.access_token);
		}
	});	
}

function setupLoadingDisplay(arr) {
	var loadingImg,loadingText;
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
}

function hasAddedPhotos(data) {
	return data["status_type"] == "added_photos";
}

function hasVideo(data) {
	ret =  data["type"] == "video";
	ret = ret &&  data["story"]!=undefined ;
	ret = ret && data["story"].indexOf("tagged")>0;

	return ret;
}

function hasMultiMedia(data){
	return hasAddedPhotos(data) || hasVideo(data);
}

function checkNextPage(arr,response,access_token) {
	if( response.paging != undefined){
		var next = response.paging["next"] + "&access token=" + access_token;
		iterateResponse(arr,next,access_token);
	}else{
		$("#loadingImg").remove();
		$("#loadingText").remove();
		showConfirmation(arr);
	}
}

function iterateResponse(arr, url,access_token){
	$.get(url, function(response,status) {
		for (data in response["data"] ) {
			if (! hasMultiMedia(data) ) {
				var id = data['id'].split("_")[1];
				arr.push(id)
			}
		}
		checkNextPage(arr,response,access_token);

	});
}

function newDeleteButton() {
	var btn =  $("<button/>")
				.addClass('btn')
				.addClass('btn-danger')
				.html('Delete')
				.css({
					"display":"inline-block	",
					"margin":"5px"
				});
	return btn;
}

function newCancelButton() {
	var btn = $("<button/>")
		.addClass('btn')
		.addClass('btn-primary')
		.addClass('pull-right')
		.html('Cancel')
		.css({
			"display":"inline-block	",
			"margin":"5px"

		});
	return btn;

}

function newPostContainer(arr) {
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
	.append( newDangerButton().click(function() { 
				initiateDeletion(arr);
			})
		)
	.append( newCancelButton().click(function() { 
				$("#options").show();
				$("#container").remove();
			})
		);
	return container;
}

function newNoPostContainer() {
	var container = $("<div/>")
		.addClass("well")
		.text("There are no posts in this range.")
		.css({
			"margin-bottom":"0px",
			"display":"inline-block",
			"width": "300px",
			"text-align": "Center"
		});
	return container;
}

function showConfirmation(arr) {
	if(arr.length>0){
		var container = newPostContainer(arr);
		$("body").append(container);
	}else{
		newNoPostContainer().appendTo($("body"));
	}
}
function setupSuccessBar() {
	var success_bar = $("<div/>")
		.addClass("progress-bar")
		.width("0%")
		.attr({
			"id" : "successProgress",
			"role":"progressBar",
			"aria-valuenow":"0",
			"aria-valuemin":"0",
			"aria-valuemax":arr.length
		})
		.text("0%")
	return success_bar
}
function setupFailureBar() {
	var failure_bar =  $("<div/>")
		.addClass("progress-bar")
		.addClass('progress-bar-danger')
		.width("0%")
		.attr({
			"id" : "failedProgress",
			"role":"progressBar",
			"aria-valuenow":"0",
			"aria-valuemin":"0",
			"aria-valuemax":arr.length
		}).text("")
	return failure_bar;
}
function setupProgressBar(arr) {
	var progress_bar = $("<div/>").addClass("progress")
	.append(setupSuccessBar())
	.append(setupFailureBar())
	.appendTo($(".well"));
}

function updateSuccessBar(percent) {
	$("#successProgress")
		.width(percent+"%")
		.text(percent+"%")
		.attr("aria-valuenow",percent);
}
function updateFailureBar(percent) {
	$("#failedProgress")
		.width(failedPercent+"%")
		.attr("aria-valuenow",failedPercent);
}
function initiateDeletion(arr){
	$(".well").html("Deletion in progress. Feel free to use your browser, but do not use the Facebook page that just opened. It will alert you when finished.");
	chrome.extension.getBackgroundPage().setUpMessaging(arr);
	
	setupProgressBar()

	var interval = setInterval(function() {
		var percent  = Math.round( 100 *(localStorage.success+localStorage.failed) /arr.length);
		var successPercent = Math.round( 100 *localStorage.success /arr.length);
		var failedPercent = Math.round( 100 *localStorage.failed /arr.length);

		updateSuccessBar(successPercent);
		updateFailureBar(failedPercent);

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
