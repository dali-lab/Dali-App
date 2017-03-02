let BeaconController = require('./BeaconController').default;
let env = require('./Environment');
import {GoogleSignin} from 'react-native-google-signin';


/**
 * This class will control all server comunication.
 * It will also take a beaconController and set up listeners for check in and enterExit,
 *   and when called will deal with these server communicatons
 */
class ServerCommunicator {
  static current = null;

  constructor(beaconController, user) {
    ServerCommunicator.current = this;
    this.user = user;
    this.awaitingUser = false;
    this.beaconController = beaconController;
    this.beaconController.addCheckInListener(this.checkIn);
    this.beaconController.addEnterExitListener(this.enterExitDALI);
  }

  checkIn=(entering) => {
    if (!entering[0]) {
      this.awaitingUser = false;
    }else{
      // TODO: send POST to server for check in
      const user = GoogleSignin.currentUser();
      if (user != null) {
        console.log("TODO: Post checkin for " + user.email);

        this.postCheckin(user);
      }else{
        // We didnt get a user... I am going to try to wait for sign in
        GoogleSignin.currentUserAsync().then((user) => {
          if (user == null) {
            this.awaitingUser = true;
          }else{
            this.postCheckin(user);
          }
        })
      }
    }
  }

  postCheckin(user) {
    this.post("https://posttestserver.com/post.php?dir=DALI", {"username": user.email}).then((response) => {
      console.log(response);
    });
  }

  loggedIn(user) {
    this.user = user
    if (this.awaitingUser) {
      checkIn(true);
    }
  }

  post(path, params, method) {
    return fetch(path, {
      method: method || 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });
  }

  enterExitDALI=() => {
    // TODO: send POST to server for enter and exit DALI
  }
}

export default ServerCommunicator;
