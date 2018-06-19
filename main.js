function Game(id, player, turn) {
    this.id = id;
    this.player = player;
    this.board = [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
        ];
    //check if it's change the this.board
    this.board = buildBoard(this.board);
    this.turn = turn;
}
function Player(name, xo) {
    this.name = name;
    this.xo = xo;
    if(xo == "X"){
        this.turn = true;
    }else{
        this.turn = false;
    }
}
function buildBoard(board) {
    var k = 0;
    for (var i = 0; i < board.length; i++) {
        var row = board[i];
        for (var j = 0; j < row.length; j++) {
            row[j] = k.toString();
            k++;
        }
    }
    return board;
}
function findIndex(board, item){
    for (var i = 0; i < board.length; i++) {
        var row = board[i];
        for (var j = 0; j < board.length; j++) {
            if(row[j] == item){
                return [i, j];
            }
        }
    }
    return [0, 0];
}
var player;
var game;
var index;
var twoPlayers;
$(function () {
    var socket = io.connect('http://localhost:3000');
    $("#new").on('click', function () {
       socket.emit("createGame", {
           name: $("#nameNew").val().trim()
        });
       $("#nameNew").val("");
    });

    $("#join").on('click', function () {
        socket.emit("joinGame", {
            name: $("#nameJoin").val().trim(),
            room: $("#room").val().trim()
        });
        $("#nameJoin").val(""),
        $("#room").val("")
    });

    $(".tile").on('click', function () {
        if (game.turn != player.turn || $(this).text() == "X" || $(this).text() == "O" ||twoPlayers != true) {
            return false;
        }
        game.turn = !game.turn;
        var id = $(this).attr("id");
        index = findIndex(game.board, id);
        game.board[index[0]][index[1]] = player.xo;
        $(this).text(player.xo);
        socket.emit("played", {
            tile: id,
            index: index,
            room: game.id,
            xo: player.xo
        });
    });

    socket.on("newGame", function(data){
        var id = data.room;
        $("#userHello").text("id: " + id);
        game = new Game(id, data.name, true);
        player = new Player(data.name, 'X');
        $(".gameBoard").show();
        $(".sub-container").hide();
    });

    socket.on('joined', function (data) {
        twoPlayers = true;
        if(player != undefined){
            return;
        }
        player = new Player(data.name, "O");
        var id = data.room;
        game = new Game(id, data.name, true);
        $(".gameBoard").show();
        $(".sub-container").hide();
    });

    socket.on('turnPlayed', function (data) {
        game.turn = !game.turn;
        if (player.xo=="O"){
            var xo = "X";
        }else{
            var xo = "O";
        }
        game.board[data.index[0]][data.index[1]] = xo;
        $("#" + data.tile).text(xo);
    });

    socket.on('win', function (data) {
        $("#userHello").text("the winnner is:" + data.winner);
    });
});