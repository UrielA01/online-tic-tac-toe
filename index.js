var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var rooms = 0;
var board = [
    ['0', '1', '2'],
    ['3', '4', '5'],
    ['6', '7', '8']
];
var games = [];

function Game(id) {
    this.board = [
        ['0', '1', '2'],
        ['3', '4', '5'],
        ['6', '7', '8']
    ];
    this.players = [];
    this.id = id;
}
function getCol(matrix, col) {
    var column = [];
    for (var i = 0; i < matrix.length; i++) {
        column.push(matrix[i][col]);
    }
    return column;
}
function getMainSlant(matrix) {
    var slant = [];
    for (var i = 0; i < matrix.length; i++) {
        slant.push(matrix[i][i]);
    }
    return slant;
}
function getSecondSlant(matrix) {
    var slant = [];
    for (var i = 0; i < matrix.length; i++) {
        slant.push(matrix[i][matrix.length - i - 1]);
    }
    return slant;
}
function checkWin(arr){
    var i;
    var j;
    for(i = 0; i < arr.length; i++){
        var row = arr[i];
        if(row[0] == row[1] && row[1] == row[2] && row[2] == row[0]){
            return true;
        }
    }
    var k = 0;
    for(i = 0; i < arr.length; i++){
        var column = getCol(arr, i);
        if (column[0] == column[1] && column[1] == column[2] && column[2] == column[0]) {
            return true;
        }
    }
    slant = getMainSlant(arr);
    if (slant[0] == slant[1] && slant[1] == slant[2] && slant[2] == slant[0]) {
        return true;
    }
    secondSlant = getSecondSlant(arr);
    if (secondSlant[0] == secondSlant[1] && secondSlant[1] == secondSlant[2] && secondSlant[2] == secondSlant[0]) {
        return true;
    }
    return false;
}

app.use(express.static('.'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/game.html');
});

io.on('connection', function (socket) {
    /**
     * Create a new game room and notify the creator of game. 
     */
    socket.on('createGame', function (data) {
        socket.join('room-' + ++rooms);
        games.push(new Game("room-" + rooms));
        games[games.length - 1].players.push(data.name);
        socket.emit('newGame', {
            name: data.name,
            room: 'room-' + rooms
        });
    });

    /**
     * Connect the Player 2 to the room he requested. Show error if room full.
     */
    socket.on('joinGame', function (data) {
        var room = io.nsps['/'].adapter.rooms[data.room];
        if (room && room.length == 1) {
            socket.join(data.room);
            for (var i = 0; i < games.length; i++) {
                if(games[i].id == data.room){
                    games[i].players.push(data.name);
                }
            }
            io.to(data.room).emit("joined", {
                name: data.name, 
                room: data.room
            });
        } else {
            socket.to(room).emit('err', {
                message: 'Sorry, The room is full!'
            });
        }
    });

    /**
     * Handle the turn played by either player and notify the other. 
     */
    socket.on('played', function (data) {
        var game;
        for (var i = 0; i < games.length; i++) {
            if (games[i].id == data.room) {
                game = games[i];
            }
        }
        game.board[data.index[0]][data.index[1]] = data.xo;
        if (checkWin(game.board)) {
            io.to(data.room).emit('win', {
                winner: data.xo
            });
        }
        socket.to(data.room).emit('turnPlayed', {
            tile: data.tile,
            index: data.index
        });
    });

    /**
     * Notify the players about the victor.
     */
    socket.on('gameEnded', function (data) {
        socket.broadcast.to(data.room).emit('gameEnd', data);
    });
});

server.on('listening', function () {
    console.log('ok, server is running');
});

server.listen(3000);