var userId=document.getElementsByName("xhpc_targetid")[0].value;
var dtsg = document.getElementsByName("fb_dtsg")[0].value;
var data = "fb_dtsg=" + dtsg + "&__user=" + userId + "&__a=1";
chrome.runtime.onConnect.addListener(function(port){
	port.onMessage.addListener(function(msg){
		if(msg.postId){
			var xhr = new XMLHttpRequest();
			var url = "https://www.facebook.com/ajax/timeline/delete?identifier=S%3A_I" + userId + "%3A" + msg.postId + "&location=9&story_dom_id=tl_unit_0";
			xhr.open("POST", url);
			xhr.withCredentials = true;
			xhr.addEventListener("load", function() {
				port.postMessage({
					status: xhr.status,
					id: msg.postId
				});
			});
			xhr.send(data);
		}
	});
});


/*
function(id){
	var userId=document.getElementsByName("xhpc_targetid")[0].value;
	var dtsg = document.getElementsByName("fb_dtsg")[0].value;
	var data = "fb_dtsg=" + dtsg + "&__user=" + userId + "&__a=1";
	var xhr = new XMLHttpRequest();
	var url = "https://www.facebook.com/ajax/timeline/delete?identifier=S%3A_I" + userId + "%3A" + msg.postId + "&location=9&story_dom_id=tl_unit_0";
	xhr.open("POST", url);
	xhr.withCredentials = true;
	xhr.addEventListener("load", function() {
		console.log(xhr);
	});
	xhr.send(data);
}

*/