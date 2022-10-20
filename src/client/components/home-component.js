import React from "react";
import {store} from "../middlewares/store";
import {updateRoomPlayerName} from "../actions/action-creators";
import {userService} from "../util/user.service";

class HomeComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      roomName: '',
      playerName: '',
      username: '',
      password: '',
      submitted: false,
      loading: false,
      error: ''
    };
  }


  handleChangeRoom(event) {
    this.setState({roomName: event.target.value});
  }

  handleChangePlayerName(event) {
    this.setState({playerName: event.target.value});
  }


  handleChangeUsername(event) {
    this.setState({username: event.target.value});
  }

  handleChangePassword(event) {
    this.setState({password: event.target.value});
  }

  handleSubmitAuth(e) {
    e.preventDefault();

    this.setState({ submitted: true });
    const { username, password, returnUrl } = this.state;

    // stop here if form is invalid
    if (!(username && password)) {
        return;
    }

    this.setState({ loading: true });
    userService.login(username, password)
        .then(
            token => {
              window.location.href = "/"
            },
            error => this.setState({ error, loading: false })
        );
}

  handleSubmitRoom(event) {
    // let user = JSON.parse(localStorage.getItem('user'));
    // console.log(user);
    window.location.href = "#" + this.state.roomName + "[" + user.profile.playerName + "]";
    store.dispatch(updateRoomPlayerName(this.state.roomName, user.profile.playerName));
    event.preventDefault();
  }

  setRoomName(name) {
    this.setState({roomName: name});
  }

  render() {
      const room = this.props.games.find(e => e.name === this.state.roomName);
      let playerInRoom;
      if (room) {
        playerInRoom = room.players
      }
      return (
        <div className={"row center font_white pad"}>
          <div className={"color8"}>
            <div className={"row center"}>
              <h1 className={"font_white font_retro"}>TETRIS</h1>
            </div>
            <form onSubmit={e => this.handleSubmitRoom(e)} className={"pad"}>
              <label>
              <input type="text"
                        value={this.state.playerName}
                        onChange={e => this.handleChangePlayerName(e)}
                        placeholder={"Create name"}/>
                #<input type="text"
                        value={this.state.roomName}
                        onChange={e => this.handleChangeRoom(e)}
                        placeholder={"Choose or create room"}/>
              </label>
              <input type="submit" value="Join"/>
            </form>

            <div className={"column pad"}>
              <div className={"pad"}>
                Current Room:
              </div>
              {this.props.games.length === 0 &&
              <div>
                No current room
              </div>}
              {this.props.games.map((r, i) =>
                <button className={"font_retro buttonPlay font_white font_button_home"} key={i}
                        onClick={() => this.setRoomName(r.name)}>{r.name + (!r.waiting ? "(playing)" : "")}
                </button>
              )}
            </div>

            {playerInRoom &&
            <div className={"column pad"}>
              <div className={"pad"}>
                Current Player in this room:
              </div>
              <div className={"pad"}>
                {playerInRoom.map((p, i) =>
                  <div key={i} className={"font_retro font_white"}>
                    {p.playerName}
                  </div>)}
              </div>
            </div>
            }
            {this.props.error.type === "PLAYER_ALREADY_IN_ROOM" &&
            <p className={"font_red pad"}>{"A player as already your pseudo in this room"}<br/></p>}

          </div>
        </div>
      );

  }
}

export {HomeComponent};
