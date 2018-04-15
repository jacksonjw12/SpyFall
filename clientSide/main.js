var socket;
var c;
var ctx;
var player = {}

var room = ""


function toggleLocationInfo(){
	if(document.getElementById("locationToggleText").innerHTML == "hide"){
		document.getElementById("sensitiveInfo").style.display = "none"
		document.getElementById("locationToggleText").innerHTML ="show"
	}
	else{
		document.getElementById("sensitiveInfo").style.display = "block"
		document.getElementById("locationToggleText").innerHTML = "hide"
	}
}
function strike(e){

	if(e.classList.contains("player-name-striked") ){
		
		e.classList.remove('player-name-striked');
		e.classList.add('player-name');


	}
	else{
		e.classList.remove('player-name');
		e.classList.add('player-name-striked');

		
	}
}
function strikeRef(e){

	if(e.classList.contains("locationReference-striked") ){
		
		e.classList.remove('locationReference-striked');
		

	}
	else{
		
		e.classList.add('locationReference-striked');

		
	}
}

function getRooms(){
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() { 
		if(xmlHttp.readyState == 4 && xmlHttp.status == 200){
			rooms = JSON.parse(xmlHttp.responseText).roomList;
			var string = "<h2 >Current Rooms</h2><table class='roomTable' style='text-align:center;'><tr><th>Name</th><th># Players</th><th></th></tr>" 
			for(r in rooms){
				room = rooms[r]
				string += "<tr><td>" + room.name + "</td><td>" + room.players + '</td><td><button class="connectButton" onclick="javascript:connectRoom('+"'"+ room.name +"'"+')">Connect</button</td</tr>' 

			}

			document.getElementById('rooms').innerHTML = string
		}

		}
	xmlHttp.open("GET", "listRooms", true); // true for asynchronous 
	xmlHttp.send({});

}

function getMenuPlayerItem(plr){
	//console.log(plr)
	return '<li class="player-name">'+plr.name+'</li>'
}

function getIGPlayerItem(plr,first){
	//console.log(plr)
	if(plr.id == first){
		return '<li class="player-name" onclick="strike(this)">'+plr.name+'<a class="firstPlayer">1st</a></li>'

	}
	else{
		return '<li class="player-name" onclick="strike(this)">'+plr.name+'</li>'

	}
}
function getMyRoles(world){

	for(var p = 0; p< world.playerData.length; p++){
		if(world.playerData[p].id == player.id){
			if(world.playerData[p].isSpy){
				player.isSpy = true;
				player.location = "Spy"
				player.role = ""
				return;
			}
			else{
				player.isSpy = false;
				player.location = world.location
				player.role = world.playerData[p].role
				return;
			}
		}
	}
}
// function assumeId(world){
// 	var foundName = false

// 	for(var plr = 0; plr< world.players.length; plr++){
// 		if(world.players[plr].name == player.name){
// 			foundName = true
// 			socket.emit("assumeId",{"id":world.player[plr].id})
// 		}
// 	}
// 	// for(var p = 0; p< world.playerData.length; p++){
// 	// 	if(world.playerData[p].id == player.id){
// 	// 		if(world.playerData[p].isSpy){
// 	// 			player.isSpy = true;
// 	// 			player.location = "Spy"
// 	// 			player.role = ""
// 	// 			return;
// 	// 		}
// 	// 		else{
// 	// 			player.isSpy = false;
// 	// 			player.location = world.location
// 	// 			player.role = world.playerData[p].role
// 	// 			return;
// 	// 		}
// 	// 	}
// 	// }
// }
function setUpRoom(data){
	console.log(data)
	if(data.world.stage == "menu"){
		document.getElementById("intro").style.display = 'none';
		document.getElementById("menu").style.display = 'block';
		document.getElementById("game").style.display = 'none';

		document.getElementById("menuPlayers").innerHTML = '';

		document.getElementById("roomTitle").innerHTML = "Room: "+data.world.name
		for(var p = 0; p < data.world.players.length; p++){
			document.getElementById("menuPlayers").innerHTML+=getMenuPlayerItem(data.world.players[p])
		}

	}
	if(data.world.stage == "game"){
		document.getElementById("intro").style.display = 'none';
		document.getElementById("menu").style.display = 'none';
		document.getElementById("game").style.display = 'block';
		document.getElementById("ingamePlayers").innerHTML = '';
		getMyRoles(data.world);
		document.getElementById("location").innerHTML = player.location
		document.getElementById("role").innerHTML = player.role
		if(player.location === undefined){
			// getMyRolesByName(data.world)
			player.location = "spectator"
			player.role = ""
		}

		for(var p = 0; p < data.world.players.length; p++){
			//console.log(document.getElementById("menuPlayers").innerHTML);
			document.getElementById("ingamePlayers").innerHTML+=getIGPlayerItem(data.world.players[p],data.world.first)
		}

	}
}
function startGame(){
	socket.emit("startGame",{})
}

function joinGame(){
	var success = giveName(document.getElementById("playerName").value)
	if(!success){
		alert("Please enter a valid name")
		return;
	}

	document.getElementById("firstConnectionStep").style.display = "none";
	document.getElementById("secondConnectionStep").style.display = "block";


}
function giveName(playerName){
	if ( !(/\S/.test(playerName))){
		console.log("Bad name, all whitespace or length 0")
   		return false;
	}
	player.name = playerName
	socket.emit("updateName",{"name":playerName})
	return true;
}
function newGame(){
	socket.emit("newRoom",{})
	

}
function endGame(){
	socket.emit("endGame",{})
}

function connectRoom(room){
	
	if(room === undefined){
		room = document.getElementById("roomName");
	}
	socket.emit('joinRoom',{"room":room})

}

function connect(){
	roomName = document.getElementById("roomName").value;
	playerName = document.getElementById("playerName").value;
	
	if(roomName != ""){
		
		room = roomName
		//document.getElementById("canvasHolder").innerHTML =
		// '<canvas id="myCanvas" width="' + gameDimmensions[0] + 'px" height="' + gameDimmensions[1] +'px" style="border:1px solid #ababab;float:left;"></canvas>' + 
		// '<div id="chatContainer" style="padding-bottom:7px;display: inline-block;height:' + chatDimmensions[1] + 'px;width:'+chatDimmensions[0]+'px;border:1px solid #ababab;">' + 
		// '<div style="overflow-y:scroll;height:'+(chatDimmensions[1]-30)+'px;" id="chat"></div><br><form action="javascript:sendMessage()"><input type="text" style="width:80%;" id="chatTextBox"><input style="width:20%;" type="submit" id="chatBoxSubmit"></form></div>';
		//createPlayer(playerName)
		
		player.name = playerName
		player.room = roomName


		socket = io();

	}

	

}
console.log(123)



function makeId(){
    var text = "";
    var possible = "ABCDE0123456789";//no f becayse i dont want any tots white

    for( var i=0; i < 6; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function sendMessage(){
	console.log("wasup")
	var message = document.getElementById("chatTextBox").value;
	if(message != "" && typeof message == "string"){
		console.log("dude")
		socket.emit('sendMessage', {"message":message,"roomName":room,"ign":player.ign,"id":player.id})
		document.getElementById("chatTextBox").value = "";
	}
	
}	

function receivedMessage(data){
	document.getElementById("chat").innerHTML+= '<u style="color:#' + data.id + '">' + data.ign + '</u>' + ' : ' + data.message + '</br>';
	var objDiv = document.getElementById("chat");
	objDiv.scrollTop = objDiv.scrollHeight;
}
// document.onload = function(){
// 	console.log(123)
// //main()
// //getRooms();

// }
function leaveRoom(){
	socket.emit('leaveRoom',{})
	
}

function main(){
	socket = io();
	
	socket.emit('requestInfo',{})
	socket.on('receiveInfo',function(data){
		console.log(data)
		player.id = data.id
		

	})

	
	socket.on('roomConnection', function(data){//contains room and our new id
		setUpRoom(data)
		console.log("here we go")
	});
	socket.on('roomError',function(data){
		console.log("ERROR")
		console.log(data)
	})
	socket.on('roomUpdate', function (data) {//contains room
		console.log("room was updated")
		setUpRoom(data)

	});
	socket.on('roomLeft',function(data){
		document.getElementById("intro").style.display = 'block';

		document.getElementById("menu").style.display = 'none';
		document.getElementById("game").style.display = 'none';


	})

	

}

main()
getRooms();
