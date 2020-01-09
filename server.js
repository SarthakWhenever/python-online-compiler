
const http = require('http');
const express = require("express");
const socket = require("socket.io");
const spawn = require('child_process').spawn;
const fs = require("fs");
const port = process.env.PORT || 8080;
let {log} = console;

const server = express();//express app
const main_server = http.createServer(server); //Server
const io = socket(main_server);//WebSocket Server
const serverError = "Server Error";
//Serving the web-pages to client
server.use(express.static('./front', {
	index: "homepage.html"
}));

//When a new client connects
io.on("connection", (client)=>{
	log("A new user connected");
	let client_id = client.id;
	let compiling = false;
	let runner;//Running Process
	client.on("compile/python", (data)=> {
		try {
			compiling = true;
			let file_path = 'run-env/python/'+client_id;
			let file = fs.writeFileSync(file_path, data.code);
			runner = spawn("python3", [file_path]);
			runner.stdout.on('data', (_buffer) => {
				client.emit("output", _buffer.toString());
			});
			runner.stderr.on("data",(_buffer)=> {
				client.emit("output", _buffer.toString());
			})
			runner.on("exit", (code)=> {
				client.emit("exited","");
				try {
					fs.unlinkSync(file_path);
				}catch(er) {log(er)}
			});
			runner.on("error",(c)=> {
				client.emit("output",c);
			});
		}catch(err) {
			log(err);
			client.emit("output", {
				error: true,
				msg: serverError
			});
		}
	});
	client.on("input", (data) => {
		try {
			if(!compiling) return;
			client.emit('output', data+"\n");
			runner.stdin.write(data+"\n");
		}catch(err) {
			log('output', {
				error: true,
				msg: serverError
			})
		}
	});
	client.on("error", (err)=> {
		console.log("Error");
	});
	client.on("disconnected", (cl)=> {
		console.log("CLient DIsconnected")
	})
}); 

io.on("close", (client)=> {
	log("A user disconnected");
});
io.on('error', (err)=> {
	log(err);
})

main_server.listen(port, (err)=> {
	if(!err) return log("Server listenting to the port ", port);
	log(err);
});