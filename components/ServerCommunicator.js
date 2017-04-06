let BeaconController = require('./BeaconController').default;
let env = require('./Environment');
let StorageController = require('./StorageController').default;
import {Platform, NativeModules} from 'react-native';
const { RNGoogleSignin } = NativeModules;
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

    GoogleSignin.currentUserAsync().then((user) => {
      if (user != null && StorageController.userIsTim(user)) {
        this.beaconController.addTimsOfficeListener(this.timsOfficeListener);
        this.beaconController.addBeaconDidRangeListener(() => {
          this.postForTim("DALI", this.beaconController.inDALI)
        })
        this.beaconController.startRanging()
      }
    })
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

  updateSharePreference(share) {
    this.enterExitDALI(this.beaconController.inDALI);
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

  getTonightsLabHours() {
    return new Promise((resolve, reject) => {
      this.getLabHours().then((hours) => {
        let now = new Date();
        let midnight = new Date();
        midnight.setHours(23, 59, 59);
        var taHours = hours.filter((hour) => {
          // Either it is in the future or it is happening now
          return (hour.startDate > now || hour.endDate > now && hour.startDate < now) && hour.startDate <= midnight && hour.status == "confirmed";
        });

        taHours.sort((hour1,hour2) => {
          return hour1.startDate > hour2.startDate;
        });

        resolve(taHours)
      });
    })
  }

  getLabHours() {
    this.accessToken = this.accessToken == undefined ? GoogleSignin.currentUser().accessToken : this.accessToken

    if (this.accessToken == undefined) {
      return GoogleSignin.currentUserAsync().then((user) => {
        return RNGoogleSignin.getAccessToken(user)
      }).then((token) => {
        this.accessToken = token
        return this.getLabHours()
      })
    }

    let accessToken = this.accessToken

    return new Promise(function(resolve, reject) {
      fetch("https://www.googleapis.com/calendar/v3/calendars/" + env.taCalendarId + "/events", {
        method: "GET",
        headers: {
          'Authorization': "Bearer " + accessToken
        }
      }).then((response) => response.json())
        .then((responseJson) => {

          if (responseJson.items == null) {
            console.log(responseJson);
            reject("No data!");
            return;
          }

          console.log(responseJson);

          responseJson.items.forEach((hour) => {
              hour.startDate = new Date(hour.start.dateTime);
              hour.endDate = new Date(hour.end.dateTime);
              hour.name = hour.summary;
              hour.skills = hour.description;
          });

          resolve(responseJson.items);
        }).catch((error) => {
          console.log(error);
          reject(error);
        });
    });
  }

  getUpcomingEvents() {
    this.accessToken = this.accessToken == undefined ? GoogleSignin.currentUser().accessToken : this.accessToken


    if (this.accessToken == undefined) {
      return GoogleSignin.hasPlayServices({ autoResolve: true }).then(() => {
        return GoogleSignin.currentUserAsync()
      }).then((user) => {
        return RNGoogleSignin.getAccessToken(user)
      }).then((token) => {
        this.accessToken = token
        return this.getUpcomingEvents()
      })
    }

    let accessToken = this.accessToken

    return new Promise((success, failure) => {
      fetch("https://www.googleapis.com/calendar/v3/calendars/" + env.eventsCalendarId + "/events", {
        method: "GET",
        headers: {
          'Authorization': "Bearer " + accessToken
        }
      }).then((response) => response.json())
        .then((responseJson) => {
          let now = new Date();
          let weekFromNow = new Date();
          weekFromNow.setDate(now.getDate() + 6);

          if (responseJson.items == null) {
            failure();
            console.log("Failed!", responseJson);
            return;
          }


          var events = responseJson.items.filter((event) => {
            event.startDate = new Date(event.start.dateTime);
            event.endDate = new Date(event.end.dateTime);

            return event.startDate > now.setHours(0,0,0) && event.startDate < weekFromNow.setHours(23, 59, 59)
          });
          events.sort((event1, event2) => {
            return event1.startDate > event2.startDate ? 1 : -1
          });

          success(events);
        }).catch((error) => {
          console.log(error);
          failure(error);
        });
    });
  }

  getTimLocation() {
    return fetch(env.timLocationInfoURL, {method: "GET"})
      .then((response) => response.json()).catch((error) => {
        console.log(error);
      })
  }

  getSharedMembersInLab() {
    return fetch(env.sharedLabURL, {method: "GET"})
      .then((response) => response.json()).catch((error) => {
        console.log(error);
      })
  }

  enterExitDALI=(inDALI) => {
    const user = GoogleSignin.currentUser();
    const complete = (user, inDALI) => {
      StorageController.getLabPresencePreference().then((share) => {
        return this.post(env.daliEnterURL, {
          user: {
            email: user.email,
            id: user.id,
            familyName: user.familyName,
            givenName: user.givenName,
            name: user.name
          },
          inDALI: inDALI,
          share: share
        });
      }).then((response) => {
        console.log(response);
      }).catch((error) => {
        // Failed to connect. Ignoring...
        console.log(error)
      });
    }

    if (StorageController.userIsTim(user)) {
      this.post(env.timLocationInfoURL, {location: "DALI", enter: inDALI})
        .then((response) => response.json()).then((responseJson) => {

        }).catch((error) => {
          // Failed...
        });
    }
    GoogleSignin.currentUserAsync().then((user) => {
      if (user == null) {
        return
      }else{
        complete(user, inDALI);
      }
    })

    // const color = StorageController.getColor().then((color) => {
    //   if (user == null) {
    //     GoogleSignin.currentUserAsync().then((user) => {
    //       if (user == null) {
    //         return
    //       }else{
    //         complete(user, inDALI);
    //       }
    //     })
    //   }else{
    //     complete(user, inDALI);
    //   }
    // });
  }

  timsOfficeListener=(enter) => {
    console.log((enter ? "Entered" : "Exited") + " tim's office!")

    // TODO: Force check for lab

    this.postForTim("OFFICE", enter);
  }

  postForTim(location, enter) {
    if (StorageController.userIsTim(GoogleSignin.currentUser())) {
      this.post(env.timLocationInfoURL, {location: location, enter: enter})
        .then((response) => response.json()).then((responseJson) => {

      }).catch((error) => {
        // Failed...
      });
    }
  }
}

export default ServerCommunicator;
