// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const axios = require('axios');
const Say = require('say').Say;
const say = new Say('darwin' || 'win32' || 'linux');

type postobject ={video_id : string; post_title : string; post_content : string};
const videos = [
	"hs7Z0JUgDeA",
	"iYgYfHb8gbQ",
	"JlPEb6WNuDI",
];

async function getRedditPosts() {
    try {
        // Make a GET request to the Reddit API
        const response = await axios.get('https://www.reddit.com/r/amitheasshole.json');

        // Extract the data from the response
        const posts = response.data.data.children;

        // Return the array of Reddit posts
        return posts;
    } catch (error) {
        // Handle any errors that occur during the API request
        console.error('Failed to retrieve Reddit posts:', error);
        return [];
    }
}

function chunkStringToWords(inputString: string, wordsPerChunk: number) {
	const words = inputString.split(" "); // Split the input string by spaces to get an array of words
	const chunkedArray = [];
	let currentChunk = [];
	
	for (let i = 0; i < words.length; i++) {
	  currentChunk.push(words[i]); // Add the word to the current chunk
	  if (currentChunk.length === wordsPerChunk) {
		chunkedArray.push(currentChunk.join(" ")); // Join the words in the current chunk with spaces and push to the chunked array
		currentChunk = []; // Reset the current chunk
	  }
	}
  
	if (currentChunk.length > 0) {
	  chunkedArray.push(currentChunk.join(" ")); // Push the remaining words in the last chunk
	}
  
	return chunkedArray;
  }

async function speakChunks(chunkedStringArray : any, postobject: postobject, updateWebview: CallableFunction) {
	for (let i = 0; i < chunkedStringArray.length; i++) {
	  const chunk = chunkedStringArray[i];
	  postobject.post_title = "";
	  postobject.post_content = chunkedStringArray[i];
	  updateWebview(postobject);
	  await new Promise<void>((resolve, reject) => {
		say.speak(chunk, null, 1.0, (err:any) => {
		  if (err) {
			reject(err);
		  } else {
			resolve();
		  }
		  
		});
	  });
	}
	console.log("All chunks have been spoken");
  }


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let count = 0;
	let disposable = vscode.commands.registerCommand('overstim.overstimulate', async () => {
		const column = { viewColumn: vscode.ViewColumn.Beside, preserverFocus: true };
		const options = { enableScripts: true, retainContextWhenHidden: true };

		const panel = vscode.window.createWebviewPanel('subway-surfers.video', "overstim", column, options);
		const video = videos.sort(() => Math.random() - 0.5)[0];
		let posts = await getRedditPosts(); 
		
		panel.reveal();

		let postobject: postobject = {
				video_id: video,
				post_content: "content",
				post_title: "title"
		};

		
		posts.shift();
		posts.shift();
		for (var key in posts){
			var post = posts[key];
			post = post.data;
			let chunkedpost = chunkStringToWords(post.selftext,20); // chunks 500 characters
			postobject.post_content = chunkedpost[0];
			postobject.post_title = post.title;
			const updateWebview = () => {
				panel.title = postobject.post_title;
				count++;
				panel.webview.html = getWebviewContent(postobject);
			};
			
			console.log(chunkedpost);
			console.log(postobject.video_id);

			
			const promise = speakChunks(chunkedpost,postobject,updateWebview);
			/*
			const promise = new Promise<void>((resolve) => {
				// Call the callback-based function
				say.speak(postobject.post_title, null, 1.0, (err: any) => {
					if (err) {
						return console.error(err);
					}
					Promise.all(promiseArray)
						.then(() => {
							console.log("All chunks have been spoken");
							// Call resolve() once all promises have resolved
							resolve();
						})
						.catch((err) => {
							console.error("Error while speaking chunks:", err);
							// Call reject() if any promise rejects
						});
				});
			});	     
			*/

			// Set initial content
			updateWebview();
			await promise;
		};
	});

	context.subscriptions.push(disposable);
}



function getWebviewContent(post: postobject){
	return `
	<html lang="en"> 
		<head>
			<meta charset="utf-8"/>
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<style>
			.video-container {
				height: 100%;
				width: 100%;
			  }
			  
			  .video-container video {
				width: 100%;
				display: block;
			  }
			  
			  .text-box {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background-color: rgba(0, 0, 0, 0.5);
				padding: 5px;
				text-align: center;
				color: #fff;
				border-radius: 10px;
			  }
			  
			  .text-box h4 {
				font-size: 2.0em;
				margin-top: 0;
			  }
			  
			  .text-box p {
				font-size: 1.2em;
			  }					  
			</style>
		</head>
		<body>
			<div class="video-container">
				<video autoplay muted width="300">
					<source src="https://yewtu.be/latest_version?id=${post.video_id}&amp;itag=22#t=100">
				</video>
				<div class="text-box">
					<h4>${post.post_title}</h4>
					<p>${post.post_content}</p>
				</div>
			</div>
		</body>
	</html>
`;
}

export function deactivate() {
	say.stop();
}