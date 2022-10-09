class SocketMap {
  constructor() {
    this.sockets = new Map();
    this.userNameToSocketId = new Map();
  }

}

const socketMap = new SocketMap();

export default socketMap;
