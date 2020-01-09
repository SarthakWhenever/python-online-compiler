let {log} = console;
let el = (x) => document.querySelectorAll(x);
let compileBtn = el("#compile-btn")[0],
inputBtn = el("#send-input")[0],
codeInput = el("#code-input")[0],
outputArea = el("#output-area")[0];
let compiling = false;
log("Script Started");

let socket = io();
socket.on("connect", (dat)=> {
	log("Connected to WebSocket Server");
});
socket.on('output', (dat)=> {
	if(!dat.error) {
		outputArea.innerText += dat;
	}else {
		outputArea.innerText += dat.msg;
	}
});
socket.on("exited", (x)=>{
	disableInputs();
	disableRun(false);
});

socket.on("disconnect",()=> {
	log("Connection Closed by Server");
});


compileBtn.onclick = function() {
	disableRun(); compiling=true;
	outputArea.innerHTML = "";
	let mainCode = getCode();
	socket.emit("compile/python", {
		code: mainCode
	});
	disableInputs(false);
}

inputBtn.onclick = function() {
	if(!compiling) return;
	socket.emit("input",codeInput.value);
}

codeInput.onkeypress = function(ev) {
	if(ev.keyCode!=13)return;
	ev.preventDefault();
	inputBtn.onclick();
}
function getCode() {
	return editor.getValue()
}
function disableInputs(bool=true) {
	[inputBtn,codeInput].forEach((x)=>x.disabled=bool);
}
function disableRun(bool=true) {
	compileBtn.disabled = bool;
}