var io
//var locations = {    {"room1":[ {"name":"AAAABB","x":100,"y":100}, {"name":"BABCDC","x":200,"y":100}]}    }

//playerexample = {"Socket":socket, "Location":{"x":42,"y",24}, "Rotation":90, "IGN":"Richard Wang", GameRoom:bestgame}
//gameroom example = {"name":abcd, }
var ljs = require("./locations");

var worldExample = {
	"name":"room1",
	"stage":"menu",
	"location":"",
	"players":[
	{
		"id":"000022",
		"socket":123,
		"name":"jack"
	},
	{
		"id":"FF5555",
		"socket":1235,
		"name":"jill"
	}

	],
	//"tileData":[{"id":999955,"x":3,"y":5,"z":0},{"id":990022,"x":6,"y":5,"z":0},{"id":110090,"x":10,"y":5,"z":0}],//instead of 2d array i will try a tile object system

	"playerData":[ ]

}

var worlds = [];

var connectedPlayers = [
	{
		"name":"jack",
		"room":"room1",
		"socket":123,
		"id":"000022"

	},
	{
		"name":"jill",
		"room":"room1",
		"socket":1235,
		"id":"FF5555"

	}


]
function rolesNotTakenHelper(length){
	var rolesIndex = []
	for(var i = 0; i< length; i++){
		rolesIndex.push(i)
	}
	return rolesIndex
}
function getRole(location,rolesNotTaken){
	roleIndex = Math.floor(Math.random()*rolesNotTaken.length)
	roleNum = rolesNotTaken[roleIndex]
	rolesNotTaken.splice(roleIndex,1)
	return location.roles[roleNum]


}
function generateGame(world){

	//console.log(world)
	world.stage = "game"
	locationIndex = Math.floor(Math.random()*locations.length)
	location = locations[locationIndex]
	world.location = location.name
	spyIndex = Math.floor(Math.random()*world.players.length)
	world.playerData = []
	rolesNotTaken = rolesNotTakenHelper(location.roles.length)
	for(var p = 0; p< world.players.length; p++){
		console.log("generating player")
		if(spyIndex == p){
			world.playerData.push({"id":world.players[p].id,"isSpy":true,"role":""})
		}
		else{
			if(rolesNotTaken.length == 0){
				rolesNotTaken = rolesNotTakenHelper(location.roles.length)
			}
			var role = getRole(location,rolesNotTaken)
			world.playerData.push({"id":world.players[p].id,"isSpy":false,"role":role})
		}
	}

	first = Math.floor(Math.random()*world.players.length)

	world.first = world.playerData[first].id

	return world

}

function getSafeWorld(world){
	sw = {}
	sw.name = world.name
	sw.stage = world.stage
	sw.players = []
	sw.location = world.location
	sw.playerData = world.playerData
	sw.first = world.first
	for(var i = 0; i< world.players.length; i++){
		sw.players.push({"name":world.players[i].name,"id":world.players[i].id})
	}
	console.log("world safely made")
	return sw
}
function endGame(world){
	world.location = ""
	world.stage="menu"
	world.playerData = []
}
function getWorld(world){
	if(world.length == 0){
		return {}
	}
	for(var w = 0; w< worlds.length; w++){
		if(worlds[w].name == world){
			return worlds[w]
		}
	}
	console.log("couldnt find that world")
	return {}
}
function getPlayer(socket){
	for(var p = 0; p<connectedPlayers.length; p++){
		if(connectedPlayers[p].socket == socket){
			
			return connectedPlayers[p];
		}
	}
}
function test(req, res){
	console.log("eyy lmao")
	res.send("hey");
}

function makeId()
{
    var text = "";
    var possible = "ABCDE0123456789";//no f becayse i dont want any  white

    for( var i=0; i < 6; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function makePlayerId(){
	
	foundGoodId = false
	while(!foundGoodId){
		id = makeId()
		isBad = false
		for(i = 0; i< connectedPlayers.length; i++){
			if (connectedPlayers[i].id == id){
				isBad = true
				break
			}
		}
		if(!isBad){
			foundGoodId = true
			return id
		}
	}
}
function makeWorldId(){
	foundGoodId = false
	while(!foundGoodId){
		id = makeId()
		isBad = false
		for(i = 0; i< worlds.length; i++){
			if (worlds[i].name == id){
				isBad = true
				break
			}
		}
		if(!isBad){
			foundGoodId = true
			return id
		}
	}
}
function disconnect(data,socket,io,leaveConnected){
	for(playerIterator in connectedPlayers){
		player = connectedPlayers[playerIterator];
		if(player.socket == socket){
			var disconnectedPlayerRoom = player.room;
			var disconnectedPlayerId = player.id;
			console.log(disconnectedPlayerId)
			console.log(player.room)
			console.log("looking for world to disconnect from")
			// io.to(player.room).emit('receivedMessage', {"message":player.name + " has disconnected", "ign":player.room,"id":player.id})
			if(leaveConnected){
				connectedPlayers.splice(playerIterator,1)

			}
			else{
				connectedPlayers[playerIterator].room = ""
			}
			
			for(worldIterator in worlds){
				world = worlds[worldIterator]
				console.log(world.name)

				if(world.name == disconnectedPlayerRoom){
					// console.log("FOUND A WORLD")
					for(var playerIterator2 in world.playerData){
						var player = world.playerData[playerIterator2];
						if(player.id == disconnectedPlayerId){
							if(worlds[worldIterator].playerData[playerIterator2].isSpy){
								endGame(world)
								io.to(world.name).emit('roomUpdate', {"message":"game has ended, spy left", "world":getSafeWorld(world)})

							}
							else{
								worlds[worldIterator].playerData.splice(playerIterator2, 1)

							}
						}
					}

					for(var playerIterator2 in world.players){
						var player = world.players[playerIterator2];
						if(player.id == disconnectedPlayerId){
							worlds[worldIterator].players.splice(playerIterator2, 1)
						}
					}
					if(world.players.length == 0){
						worlds.splice(worldIterator,1)
					}

				}
			}


		}
	}

}
function initializeSockets(server){
	io = require('socket.io')(server);
	io.on('connection', function (socket) {
		
			
		//socket.emit('requestInfo', {});
		connectedPlayers.push({"socket":socket,"name":"","room":"","id":makePlayerId()})
	
		socket.on('requestRooms', function (data){
			var rooms = ""
			for(var i = 0; i< worlds.length; i++){
				rooms += worlds[i].name
			}
			socket.emit('listRooms', {"rooms":rooms})
		});



		socket.on('requestInfo',function(data){
			
			plr = getPlayer(socket)
			socket.emit('receiveInfo',{"id":plr.id})

		});
		socket.on('updateName',function(data){
			console.log("NAME GOT")
			for(var p = 0; p<connectedPlayers.length; p++){
				if(connectedPlayers[p].socket == socket){
					connectedPlayers[p].name = data.name;
					if(connectedPlayers[p].room != ""){
						world = getWorld(connectedPlayers[p].room)
						for(var plr = 0; plr<world.players.length; plr++){
							if(plr.id == connectedPlayers[p].id){
								plr.ign = data.name
							}
						}
					}
					return;
				}
			}
		})
		socket.on('leaveRoom',function(data){
			disconnect(data,socket,io,false)
			console.log("player disconnected");
			socket.emit('roomLeft',{})

		})

		socket.on('disconnect', function (data){
		// 	console.log("disconnecting")
			//disconnect(data,socket,io,true)


			console.log("player disconnected");
			
		});
		socket.on('sendMessage', function(data){
			console.log("----" + data.message + "---")
			io.to(data.roomName).emit('receivedMessage', data)
		});

		socket.on('startGame',function(data){
			player = getPlayer(socket)
			roomName = player.room
			console.log(roomName)
			world = getWorld(roomName)
			
			generateGame(world)
			console.log("game generated")
			io.to(roomName).emit('roomUpdate', {"message":"game has started", "world":getSafeWorld(world)})

		});
		socket.on('endGame',function(data){
			player = getPlayer(socket)
			roomName = player.room
			
			world = getWorld(roomName)
			
			endGame(world)
			console.log("game ended")
			io.to(roomName).emit('roomUpdate', {"message":"game has ended", "world":getSafeWorld(world)})

		});

		socket.on('newRoom',function(data){
				worldId = makeWorldId()
				player = getPlayer(socket)

				socket.join(worldId)
				worldExample.name = worldId
				worldExample.players = [{"id":player.id, "socket":socket, "name":player.name}]
				worldExample.playerData = []
				worlds.push(worldExample)
				console.log("new room")
				//connectedPlayers.push({"socket":socket,"name":data.playerName,"room":worldId,"id":data.id})
				for(var cp = 0; cp< connectedPlayers.length; cp++){
					if(connectedPlayers[cp].socket == socket){
						connectedPlayers[cp].room = worldId
					}
				}
				socket.emit('roomConnection', {"id":player.id,"world":getSafeWorld(worldExample)})

		});

		socket.on('joinRoom', function (data){//This is what is called when aplayer fully joins a room for good
			//console.log(data.room.name + "joined")
			newRoom = true;
			player = getPlayer(socket)
			currentWorld = {}
			//console.log(player)
			for(worldIterator in worlds){
				world = worlds[worldIterator]
				if(world.name == data.room){
					currentWorld = world
					newRoom = false;

				}
			}
			//console.log(currentWorld)
			if(newRoom){
				socket.emit('roomError', {"errno":0,"message":"that room doesnt exist, was it a typo?"})
				// worldExample.name = data.roomName
				// worldExample.players = [{"id":data.id, "socket":socket, "ign":data.playerName}]
				// worldExample.playerData = []
				// worlds.push(worldExample)
				// console.log("new room")
			}
			for(var p = 0; p <currentWorld.players.length; p++){
				if(currentWorld.players[p].name == player.name){
					socket.emit('roomError',{"errno":1, "message":"A player already exists with that name"})
					return;
				}
			}
			socket.join(data.room)

			for(var cp = 0; cp< connectedPlayers.length; cp++){
				if(connectedPlayers[cp].socket == socket){
					connectedPlayers[cp].room = data.room
				}
			}
			//data.id = makePlayerId()
			//console.log(data.id)
			currentWorld.players.push({"id":player.id, "socket":socket, "name":player.name})
			io.to(data.room).emit('roomUpdate', {"message":player.name + " has connected", "world":getSafeWorld(currentWorld)})

			//socket.emit('newTileData', {"numberOf":"multiple", "tiles":world.tileData})
			//console.log("gave tile data----------------------------------------------")
			
			


			socket.emit('roomConnection', {"id":player.id,"world":getSafeWorld(currentWorld)})
			
		});

		// socket.on('myLocation', function (data) {
		// 	//data = {roomName, id, x,y}

		// 	for(worldIterator in worlds){
		// 		world = worlds[worldIterator]

		// 		if(world.name == data.roomName){
		// 			var newPlayer = true
		// 			for(playerIterator in world.playerData){
		// 				player = world.playerData[playerIterator]
		// 				if(player.id == data.id){


		// 					newPlayer = false
		// 					player.x = data.x
		// 					player.y = data.y
		// 				}
		// 			}
		// 			if(newPlayer){
		// 				console.log("new Player")
		// 				if(world.playerData)
		// 				world.playerData.push({"id":data.id,"x":data.x,"y":data.y})
		// 				console.log("added a new player : " + data.id)
						
		// 				console.log("hi dude")
		// 				console.log(world)

		// 			}
		// 			io.to(data.roomName).emit('locations',{"locations":world.playerData})
					

					
		// 		}
				
		// 	}

		// });
		// socket.on('addedTile', function (data){

		// 	for(worldIterator in worlds){
		// 		world = worlds[worldIterator]
				
		// 		if(world.name == data.roomName){
		// 			var newTile = true;
		// 			for(var i = 0; i<world.tileData.length; i++){
		// 				if(data.tile.x == world.tileData[i].x && data.tile.y == world.tileData[i].y && data.tile.z == world.tileData[i].z){
		// 					world.tileData[i].id = data.tile.id;
		// 					newTile = false;
		// 				}
		// 			}
		// 			if(newTile){
		// 				world.tileData.push(data.tile)
		// 			}
		// 			io.to(data.roomName).emit('newTileData', {"numberOf":"single", "tile":data.tile})

		// 		}
				
		// 	}



		// });

		
		
	});



}
function listRooms(req, res){
	var rooms = []
	for(w in worlds){
		world = worlds[w]
		rooms.push({"name":world.name,"players":world.players.length})
	}
	res.send({"roomList":rooms});
}

function listRoomsExtended(req, res){
	var rooms = []
	for(w in worlds){
		world = worlds[w]
		names = []
		for(var p = 0; p< world.players.length; p++){
			names.push(world.players[p].name)
		}
		rooms.push({"name":world.name,"players":world.players.length,"names":names})
	}
	res.send({"roomList":rooms});
}


var exports;
exports.test = test;
exports.listRooms = listRooms;

exports.listRoomsExtended = listRoomsExtended;
exports.initializeSockets = initializeSockets;