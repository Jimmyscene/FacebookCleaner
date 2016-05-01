----------------------------------------------------
[Notes]
Goals:
<<<<<<< HEAD
1. Send array to page-> Execute script on page.
	Send updates to addon

	This way the user doesn't need to keep the addon open.

2. (NOT COMPLETE)Add profile picture and name to fbInit, add to local storage. No reason to load every time user clicks the button.
3. Check if status code==200.
	Save Date Range to localStorage
	Add cancel button

	Why are some statuses undefined?
	Add Progress bar
	-If facebook page changes, let user decide what to do

	Add the messaging system in the login script.(Not necessarily in the same function, in case the page changes, and we need to reinject the message system but not log in.)
4. Move most of popup.js into background. 


VIEWS REQUIRED:
-Please move to facebook domain
-Please sign in ----implement
-Select range
-Confirmation
-Progress
-Done(Restart?)


Implementation:
	Using temporary messaging with login script, set up permanent with deletion of posts. addEventListener("load") port.postMessage(StatusCode, arrIndex)
	in main 
	addEventListener(onMessage) { if message.name == ///, if(message.status!=OK) { errorsIndex += message.arrIndex; progressBar.color=red; } else { progressBar++ } 
	onFinish = if(len(errorsIndex) >0) { for(x=0; x<len(errorsIndex); x++) { if(errorsIndex[x] == undefined ) {
		errorsIndex.splice(x,1); else{
	
	
	console.log(arr[errorsIndex[x]) }} // Possibly set arr to ErrorsIndex?  

=======
----------------------------------------------------
[Notes]
Goals:
=======
>>>>>>> 86b6da7154c35f3f7bc5b57498036338ba486e9a
1. addListener Branch implementing script to send progress to extension.
2. Create an actual CSS file. Keeping it all inline is going to be a headache soon.



-----------------------------------------------------------
