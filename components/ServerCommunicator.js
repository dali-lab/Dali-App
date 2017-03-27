let BeaconController = require('./BeaconController').default;
let env = require('./Environment');
let StorageController = require('./StorageController').default;
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

        this.postCheckin(user).then((response) => {
          this.beaconController.checkInComplete();
        });
      }else{
        // We didnt get a user... I am going to try to wait for sign in
        GoogleSignin.currentUserAsync().then((user) => {
          if (user == null) {
            this.awaitingUser = true;
          }else{
            this.postCheckin(user).then((response) => {
              this.beaconController.checkInComplete();
            }).catch((response) => {
              // Failed to connect. Ignore...
            });
          }
        })
      }
    }
  }

  postCheckin(user) {
    return this.post(env.checkInURL, {"username": user.email});
  }

  loggedIn(user) {
    this.user = user;
    this.beaconController.requestPushPermissions()
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

  getLabHours() {
    return new Promise(function(resolve, reject) {
      fetch("https://www.googleapis.com/calendar/v3/calendars/" + env.taCalendarId + "/events", {
        method: "GET",
        headers: {
          'Authorization': "Bearer " + GoogleSignin.currentUser().accessToken
        }
      }).then((response) => response.json())
        .then((responseJson) => {

          let now = new Date();
          var taHours = responseJson.items.filter((hour) => {
            hour.startDate = new Date(hour.start.dateTime);
            hour.endDate = new Date(hour.end.dateTime);
            hour.name = hour.summary;
            hour.skills = hour.description;

            return hour.startDate > now.setHours(0,0,0) && hour.startDate < now.setHours(23, 59, 59);
          });

          resolve(taHours);
        }).catch((error) => {
          reject(error);
        });
    });
  }

  getUpcomingEvents() {
    return new Promise((success, failure) => {
      fetch("https://www.googleapis.com/calendar/v3/calendars/" + env.eventsCalendarId + "/events", {
        method: "GET",
        headers: {
          'Authorization': "Bearer " + GoogleSignin.currentUser().accessToken
        }
      }).then((response) => response.json())
        .then((responseJson) => {
          let now = new Date();
          let weekFromNow = new Date();
          weekFromNow.setDate(now.getDate() + 7);
          var events = responseJson.items.filter((event) => {
            event.startDate = new Date(event.start.dateTime);
            event.endDate = new Date(event.end.dateTime);

            return event.startDate > now.setHours(0,0,0) && event.startDate < weekFromNow.setHours(23, 59, 59)
          })

          success(events);
        }).catch((error) => {
          failure(error);
        });
    });
  }

  enterExitDALI=(inDALI) => {
    const user = GoogleSignin.currentUser();
    const complete = (user, inDALI) => {
      this.post(env.daliEnterURL, {user: {email: user.email, id: user.id, familyName: user.familyName, givenName: user.givenName, name: user.name}, inDALI: inDALI, color: color})
      .then((response) => {
      }).catch((error) => {
        // Failed to connect. Ignoring...
      });
    }

    const color = StorageController.getColor().then((color) => {
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
    });
  }
}

export default ServerCommunicator;
