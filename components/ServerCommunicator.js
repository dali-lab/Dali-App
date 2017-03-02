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
    if (!entering) {
      this.awaitingUser = false;
    }else{
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
    this.post(env.checkInURL, {"username": user.email}).then((response) => {
      console.log(response);
    });
  }

  loggedIn(user) {
    this.user = user;
    if (this.awaitingUser) {
      this.checkIn(true);
    }
    if (this.beaconController.inDALI) {
      this.enterExitDALI();
    }
  }

  post(path, params, method) {
    console.log("Posting to: " + path);
    return fetch(path, {
      method: method || 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });
  }

  enterExitDALI=(inDALI) => {
    const user = GoogleSignin.currentUser()

    const complete = (user, inDALI) => {
      this.post(env.daliEnterURL, {user: {email: user.email, id: user.id, familyName: user.familyName, givenName: user.givenName, name: user.name}, inDALI: inDALI})
      .then((response) => {
      });
    }

    if (user == null) {
      GoogleSignin.currentUserAsync().then((user) => {
        if (user == null) {
          return
        }else{
          complete(user, inDALI);
        }
      })
    }else{
      complete(user, inDALI);
    }
  }
}

export default ServerCommunicator;
