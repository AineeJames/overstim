// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const axios = require('axios');
const Say = require('say').Say;
const say = new Say('darwin' || 'win32' || 'linux');

type postobject = { video_id: string; post_title: string; post_content: string };
const videos = [
	"hs7Z0JUgDeA", // subway
	"iYgYfHb8gbQ", // subway
	"JlPEb6WNuDI", // minecraft
	"3EY65TxUB5E", // blue star
	"y6oMutwJQCw", // nature
	"iaQ6S-YZEtU", //
	"Unt3NPNPzR4"  //
];

async function getRedditPosts(reddit: string) {
	try {
		// Make a GET request to the Reddit API
		const response = await axios.get('https://www.reddit.com/r/' + reddit + '.json');

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

function splitStringIntoSentences(str: string, n: number) {
	// Use a regular expression to split the string into sentences
	const sentences = str.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");

	// Filter out any empty sentences
	const filteredSentences = sentences.filter(sentence => sentence.trim() !== '');

	return filteredSentences;
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

async function speakChunks(chunkedStringArray: any, postobject: postobject, updateWebview: CallableFunction) {
	for (let i = 0; i < chunkedStringArray.length; i++) {
		console.log("inside speak chunks");
		const chunk = chunkedStringArray[i];
		postobject.post_title = "";
		postobject.post_content = chunkedStringArray[i];
		updateWebview(postobject);

		const timeoutPromise = new Promise<void>((_, reject) => {
			setTimeout(() => {
				reject(new Error('Timeout exceeded'));
			}, 10000); // Timeout set to 10 seconds
		});

		const speechPromise = new Promise<void>((resolve, reject) => {
			// Call the callback-based function
			say.speak(chunk, null, 1.0, (err: any) => {
				if (err) {
					reject(err); // Reject the promise with the error
				} else {
					resolve();
				}
			});
		});

		try {
			await Promise.race([speechPromise, timeoutPromise]);
		} catch (err) {
			console.error(err); // Log the error
			continue; // Move on to the next iteration of the loop
		}
	}
	console.log("All chunks have been spoken");
}






// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const configuration = vscode.workspace.getConfiguration('overstim');
	const reddit: string = configuration.get('subreddit')!;
	let count = 0;
	let disposable = vscode.commands.registerCommand('overstim.overstimulate', async () => {
		const column = { viewColumn: vscode.ViewColumn.Beside, preserverFocus: true };
		const options = { enableScripts: true, retainContextWhenHidden: true };

		const panel = vscode.window.createWebviewPanel('subway-surfers.video', "overstim", column, options);
		let posts = await getRedditPosts(reddit);

		panel.reveal();



		posts.shift();
		posts.shift();
		let video = videos.sort(() => Math.random() - 0.5)[0];
		let lastvideo = video;
		for (var key in posts) {

			video = videos.sort(() => Math.random() - 0.5)[0];
			while (video === lastvideo) {
				video = videos.sort(() => Math.random() - 0.5)[0];
			}
			lastvideo = video;

			let postobject: postobject = {
				video_id: video,
				post_content: "content",
				post_title: "title"
			};

			var post = posts[key];
			post = post.data;
			//let chunkedpost = chunkStringToWords(post.selftext,20); // chunks 500 characters
			let chunkedpost = splitStringIntoSentences(post.selftext, 3);
			postobject.post_content = "";
			postobject.post_title = post.title;
			panel.webview.html = getWebviewContent(postobject);
			const updateWebview = () => {
				panel.title = post.post_title;
				count++;
				//panel.webview.html = getWebviewContent(postobject);
				panel.webview.postMessage(postobject);
			};

			console.log(chunkedpost);
			console.log(postobject.video_id);


			const titlepromise = new Promise<void>((resolve) => {
				// Call the callback-based function
				say.speak(postobject.post_title, null, 1.0, (err: any) => {
					if (err) {
						return console.error(err);
					}
					resolve();
				});
			});

			const timeoutPromise = new Promise<void>((_, reject) => {
				setTimeout(() => {
					reject(new Error('Timeout exceeded'));
				}, 4000); // Timeout set to 7 seconds
			});

			try {
				await Promise.race([titlepromise, timeoutPromise]); // Wait for the first promise to resolve or reject
				console.log("Title spoken successfully");
			} catch (error) {
				console.error("Error: ", error); // Log the error if any
			}

			console.log("finished title");
			updateWebview();

			const promise = speakChunks(chunkedpost, postobject, updateWebview);


			// Set initial content
			updateWebview();
			await promise;
		};
	});

	context.subscriptions.push(disposable);
}



function getWebviewContent(post: postobject) {
	return `
	<html lang="en"> 
		<head>
			<meta charset="utf-8"/>
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<style>
			.video-container {
				position: relative;
				height: 100vh;
				overflow: hidden;
			  }
			  
			  .video-container video {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%; /* Set width to 100% to fill the container horizontally */
				height: 100%;
				overflow: hidden;
			  }
			  
			  .text-box {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 75hw;
				backdrop-filter: blur(10px);
				background-color: rgba(0, 0, 0, 0.2);
				padding: 5px;
				text-align: center;
				color: #fff;
				border-radius: 10px;
				box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
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
				<video autoplay loop muted>
					<source src="https://yewtu.be/latest_version?id=${post.video_id}&amp;itag=22#t=100">
				</video>
				<div class="text-box">
					<h4 id="title">${post.post_title}</h4>
					<p id="content">${post.post_content}</p>
				</div>
			</div>
		<script>
		const title = document.getElementById('title');
		const content = document.getElementById('content');
		window.addEventListener('message', event => {

            const message = event.data; // The JSON data our extension sent
			console.log(message)
			console.log(message.post_title)
			if (message.post_title != ''){
				title.textContent = message.post_title
			}
			content.textContent = message.post_content
			if (message.post_title == ''){
				title.remove()		
			}

		});
		</script>
		</body>
	</html>
`;
}

export function deactivate() {
	say.stop();
}
