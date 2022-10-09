import "./util/ArraysUtil";
import express from "express";
import RoomSocketHandler from "./handlers/RoomSocketHandler";
import GameManager from "./data/game/GameManager";
import GlobalSocketHandler from "./handlers/GlobalSocketHandler";
import TetrisSocketHandler from "./handlers/TetrisSocketHandler";
import SocketMap from "./data/SocketMap";
import socketDefs from "../common/socket-definitions";
import Piece from "./data/piece/Piece";
import PacketSender from "./packet/PacketSender";
import {Server} from "http";

class App {

  handleClient(socket) {

    const roomSocketHandler = new RoomSocketHandler(socket);
    const globalSocketHandler = new GlobalSocketHandler(socket);
    const tetrisSocketHandler = new TetrisSocketHandler(socket);

    SocketMap.sockets.set(socket.id, socket);

    globalSocketHandler.connection();

    socket.on(socketDefs.HOME,                  (d) => globalSocketHandler.home());
    socket.on(socketDefs.JOIN_GAME,             (d) => roomSocketHandler.joinGame(d));
    socket.on(socketDefs.QUIT_GAME,             (d) => roomSocketHandler.quitGame(d));
    socket.on(socketDefs.START_PLAYING,         (d) => roomSocketHandler.startPlaying(d));
    socket.on(socketDefs.GENFLOW,               (d) => tetrisSocketHandler.genFlow(d));
    socket.on(socketDefs.GENPLAYERFLOW,         (d) => tetrisSocketHandler.genPlayerFlow(d));
    socket.on(socketDefs.TETRIS_PLACE_PIECE,    (d) => tetrisSocketHandler.placePiece(d));
    socket.on(socketDefs.PLAYER_LOOSE,          (d) => tetrisSocketHandler.playerLoose(d));
    socket.on(socketDefs.PLAYER_COMPLETE_LINE,  (d) => tetrisSocketHandler.playerCompleteLine(d));

    socket.on(socketDefs.DISCONNECT, () => {
      const room = GameManager.getGameById(socket.id);
      if (room) {
        const player = room.getPlayer(socket.id);
        roomSocketHandler.quitGame({roomName: room.name, playerName: player.playerName});
      }
    });
  }

  main() {
    const app = express();
    let server;

    app.use(express.static('./dist/client'));
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.post('/api/tetris/sendflow', (req, res) => {
      const {roomName, playerName} = req.body;
      console.log("tetris/sendflow", roomName, playerName);
      const tetrisPieces = Piece.generatePieces(10);
      const game = GameManager.getGame(roomName);
      if (!game) {
        return res.status(400).send("Game not found");
      }
      const playerId = game.getPlayerByName(playerName);
      if (!playerId) {
        return res.status(400).send("Player not found");
      }
      PacketSender.sendGenFlowToPlayer(playerId.id, true, tetrisPieces);
      return res
            .status(200)
            .send({ message: 'Pieces sent.' })
    });

    server = Server(app);

    const io = require("socket.io")(server);
    io.on(socketDefs.CONNECTION, (e) => this.handleClient(e));
    server.listen((process.env.SERVPORT) || 4433, function () {
      console.log('Server on port : ' + (process.env.SERVPORT || 4433));
    });
    return { server, io }
  }
}


const app = new App().main();


export default app
