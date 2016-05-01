var port = chrome.runtime.connect(chrome.runtime.id, {
	name: 'FacebookCleaner'
});
var userId = new RegExp(/c_user=(\d*)/g).exec(document.cookie)[1];
var dtsg = encodeURI(document.getElementsByName('fb_dtsg')[0].value);
port.onMessage.addListener(function(msg) {
	alert();
	if( msg.deletionFlag[0]){

		deletePost(msg.deletionFlag[1]);

	}else{
		console.log(msg);
	}
});

function deletePost(postId){
	var xhr = new XMLHttpRequest();
    var data = 'fb_dtsg=' + dtsg + '&__user=' + userId + '&__a=1';
    var url = 'https://www.facebook.com/ajax/timeline/delete?identifier=S%3A_I' + userId + '%3A' + postId + '&location=9&story_dom_id=tl_unit_0';
    console.log(url);
    xhr.open('POST', url);
    xhr.withCredentials = true;
    xhr.addEventListener('load', function() {
    	port.postMessage({
    		id: postId,
    		deleted: xhr.status
    	});
    });
    xhr.send(data);
}



// 10152486799161893_10154015963376893
// https://www.facebook.com/ajax/timeline/delete?identifier=S%3A_I649851892%3A10154015963376893&location=9&story_dom_id=tl_unit_2426999354348631065&render_location=10&is_notification_preview=0&dpr=1
// https://www.facebook.com/ajax/timeline/delete?identifier=S%3A_I649851892%3A10154015963376892&location=9&story_dom_id=tl_unit_0