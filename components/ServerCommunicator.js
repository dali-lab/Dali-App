/**
ServerCommunicator.js
Deals with connecting to the internet, getting data from it, parsing it, and filtering it for the rest of the application.
Also sets up listeners for checkin's, enter, exit, and tim's office, sending relevant information to the server

AUTHOR: John Kotz
*/

import {Platform, NativeModules} from 'react-native';
const { RNGoogleSignin } = NativeModules;
import {GoogleSignin} from 'react-native-google-signin';


let BeaconController = require('./BeaconController').default;
let env = require('./Environment');
let StorageController = require('./StorageController').default;
let GlobalFunctions = require('./GlobalFunctions').default;

let days = ['SU','MO','TU','WE','TH','FR','SA'];
const debugging = false

function DifferenceInDays(firstDate, secondDate) {
   return Math.round((secondDate-firstDate)/(1000*60*60*24));
}


/**
This class will control all server comunication.
It will also take a beaconController and set up listeners for check in and enterExit,
and when called will deal with these server communicatons

STATIC:
- current: Reference to the current ServerCommunicator object

TODO:
- Fully test awaitingUser system
*/
class ServerCommunicator {
   static current = null;

   constructor(beaconController) {
      if (ServerCommunicator.current != null) {
         throw "Can't create more than one instance of ServerCommunicator at a time"
         return
      }

      // Experimental system for saving checkin action for login
      this.awaitingUser = false;
      // For simple interclass relations
      this.beaconController = beaconController;

      // Set up listeners
      this.beaconController.addCheckInListener(this.checkIn);
      this.beaconController.addEnterExitListener(this.enterExitDALI);

      // Set up Tim if user is Tim
      if (GlobalFunctions.userIsTim()) {
         this.beaconController.addTimsOfficeListener(this.timsOfficeListener);
         this.beaconController.addBeaconDidRangeListener(() => {
            this.postForTim("DALI", this.beaconController.inDALI)
         });
      }

      // To get current locations
      this.beaconController.startRanging()

      // Save this is current
      ServerCommunicator.current = this;

      GoogleSignin.currentUserAsync((user) => {
         this.user = user
      })
   }

   /// On a checkin event
   checkIn=(entering) => {
      if (!entering) {
         // Again, experimental system
         this.awaitingUser = false;
      }else{
         const user = this.user;
         if (user != null) {
            // Post checkin
            this.postCheckin(user).then((response) => {
               this.beaconController.checkInComplete();
            });
         }else{
            // We didnt get a user... I am going to try to wait for sign in
            GoogleSignin.currentUserAsync().then((user) => {
               if (user == null) {
                  // Experimental...
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

   // Called when the user changes their sharing preferences. I will notify the server using the enter exit post system
   updateSharePreference(share) {
      this.enterExitDALI(this.beaconController.inDALI);
   }

   /// Posts to the relevant data to the relevant server
   postCheckin(user) {
      if (user != null) {
         return this.post(env.checkInURL, {"username": user.email});
      }
      return new Promise(function(resolve, reject) {
         reject("User is not a DALI member")
      });
   }

   /// On login
   loggedIn(user) {
      // In case notifications aren't setup
      this.beaconController.setUpNotifications()
      // If I log in after trying to check in, then I will do my best to delay this action till the login
      if (this.awaitingUser) {
         this.checkIn(true);
      }

      // Post inDALI stuff
      if (this.beaconController.inDALI) {
         this.enterExitDALI();
      }

      GoogleSignin.currentUserAsync((user) => {
         this.user = user
      })
   }

   getEventNow() {
      return new Promise(function(resolve, reject) {
         resolve({
            name: "The Pitch",
            votingOpen: true,
            resultsReleased: false,
            description: "You have now seen many pitches, so now please choose the three that you think showed the most merit in your opinion.",
            options: [
               {name: "Pitch 1", id: 1},
               {name: "Pitch 2", id: 2},
               {name: "Pitch 3", id: 3},
               {name: "Pitch 4", id: 4},
               {name: "Pitch 5", id: 5},
               {name: "Pitch 6", id: 6},
               {name: "Pitch 7", id: 7},
            ]
         });
      });
   }

   /// Simple convenience post method
   post(path, params, method) {
      if (this.user != null) {
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
      return new Promise(function(resolve, reject) {
         reject("Can't post if you are not a member");
      });
   }

   /// Calls getLabHours and filters it by those still tonight
   getTonightsLabHours() {
      const prefix = "> getTonightsLabHours: ";
      if (debugging) {console.log("Running getTonightsLabHours...");}

      return new Promise((resolve, reject) => {
         this.getLabHours().then((hours) => {
            if (debugging) {console.log(prefix + "Got back:", hours);}
            let now = new Date();
            let midnight = new Date();
            midnight.setHours(23, 59, 59);
            if (now.getHours() < 4) {
               now.setDate(now.getDate() - 1);
               now.setHours(23, 59, 59);
               midnight.setDate(midnight.getDate() - 1);
            }
            var taHours = hours.filter((hour) => {
               const innerPrefix = "==" + prefix + hour.name + ": "
               if (hour.status != "confirmed") {
                  return false;
               }


               // This method worked for the first week, but no longer!
               // Because we only get one event for each that recurrs
               if (hour.recurrence == undefined || hour.recurrence.length == 0) {
                  if (debugging) {console.log(innerPrefix + "No recurrence");
                  console.log(innerPrefix + "Should show:", (hour.startDate > now || hour.endDate > now && hour.startDate < now) && hour.startDate <= midnight);}
                  return (hour.startDate > now || hour.endDate > now && hour.startDate < now) && hour.startDate <= midnight;
               }

               // This new method should determine what day of the week the
               let numDaysDiff = DifferenceInDays(hour.startDate, now);
               if (debugging) {console.log(innerPrefix + "Num days diff:", numDaysDiff);}

               let recurrence = hour.recurrence[0];
               let parts = recurrence.replace("RRULE:", "").split(';');
               let freq = parts[0].replace("FREQ=", "");
               let count = parseInt(parts[1].replace("COUNT=", ""));
               let day = parts[2].replace("BYDAY=", "");

               let lastDuplicate = new Date(hour.end.dateTime);
               lastDuplicate.setDate(hour.startDate.getDate() + 7 * count);

               if (now > lastDuplicate) {
                  // The last occurence of this event has passed

                  if (debugging) {console.log(innerPrefix + "Past expiration");}
                  return false;
               }else if (days[now.getDay()] != day){
                  // Not the right day of the week
                  if (debugging) {console.log(innerPrefix + "Not today!");}
                  return false;
               }else{
                  // Right day of week. Check time
                  if (debugging) {console.log(innerPrefix + "Correct day");}

                  let thisWeeksEndTime = new Date(hour.end.dateTime);
                  thisWeeksEndTime.setDate(thisWeeksEndTime.getDate() + numDaysDiff);

                  if (debugging) {console.log(innerPrefix + "Now is:", now);
                  console.log(innerPrefix + "Ends at:", thisWeeksEndTime);}

                  let shouldShow = thisWeeksEndTime > now
                  if (debugging) {console.log(innerPrefix + "Should show:", shouldShow);}
                  return shouldShow;
               }
            });

            taHours.sort((hour1,hour2) => {
               return hour1.startDate > hour2.startDate;
            });

            resolve(taHours)
         }).catch((error) => {
            reject(error)
         });
      })
   }

   // Gets the lab hours listed on the Google Calendar
   getLabHours() {
      const prefix = "==> getLabHours: ";
      if (debugging) {console.log("Running getLabHours");}
      return GoogleSignin.currentUserAsync().then((user) => {
         if (user == null){
            return new Promise(function(resolve, reject) {
               reject()
            });
         }
         this.user = user

         // I can access the calendar
         return new Promise(function(resolve, reject) {
            // There is some wierd accessToken stuff on Android, so I will check if I have it...
            this.accessToken = this.accessToken == undefined ? user.accessToken : this.accessToken
            if (debugging) {console.log(prefix + "Access token?", this.accessToken);}

            if (this.accessToken == undefined) {
               if (debugging) {console.log(prefix + "Nope...");}
               // If not, I will request it...
               RNGoogleSignin.getAccessToken(user).then((token) => {
                  // Save it...
                  this.accessToken = token

                  if (debugging) {console.log(prefix + "New one?", this.accessToken);
                  // And start the function over
                  console.log(prefix + "Starting over...");}
                  this.getLabHours().then(() => {
                     resolve.apply(null, arguments);
                  }).catch(() => {
                     reject.apply(null, arguments);
                  })
               }).catch(() => {
                  reject.apply(null, arguments);
               })
            }

            if (debugging) {console.log(prefix + "Yup!");}

            // Now that I have the token...
            let accessToken = this.accessToken
            if (debugging) {console.log(prefix + "Fetching calendar...");}
            fetch("https://www.googleapis.com/calendar/v3/calendars/" + env.taCalendarId + "/events", {
               method: "GET",
               headers: {
                  'Authorization': "Bearer " + accessToken
               }
            }).then((response) => response.json())
            .then((responseJson) => {
               if (debugging) {console.log(prefix + "Got it:", responseJson);}

               // Handle no data
               if (responseJson == null || responseJson.items == null) {
                  console.log(responseJson);
                  reject("No data!");
                  return;
               }

               // Parse data into machine readable info
               responseJson.items.forEach((hour) => {
                  hour.startDate = new Date(hour.start.dateTime);
                  hour.endDate = new Date(hour.end.dateTime);
                  hour.name = hour.summary;
                  hour.skills = hour.description;
               });

               // Return data
               resolve(responseJson.items);
            }).catch((error) => {
               console.log(error);
               reject(error);
            });
         });
      });
   }

   /// Gets the events in the next week
   getUpcomingEvents() {
      return new Promise((success, failure) => {
         GoogleSignin.currentUserAsync().then((user) => {
            if (user != null) {
               this.accessToken = this.accessToken == undefined ? user.accessToken : this.accessToken


               if (this.accessToken == undefined) {
                  return GoogleSignin.hasPlayServices({ autoResolve: true }).then(() => {
                     return GoogleSignin.currentUserAsync()
                  }).then((user) => {
                     return RNGoogleSignin.getAccessToken(user)
                  }).then((token) => {
                     this.accessToken = token
                     this.getUpcomingEvents().then(() => {
                        success.apply(arguments);
                     }).catch(() => {
                        failure.apply(arguments);
                     })
                  })
               }
            }

            let accessToken = this.accessToken

            fetch("https://www.googleapis.com/calendar/v3/calendars/" + (user != null ? env.eventsCalendarId : env.publicEventsCalendarId) + "/events" + (user == null ? "?key=" + env.googleConfig.publicKey : ""), {
               method: "GET",
               headers: user != null ? {
                  'Authorization': "Bearer " + accessToken
               } : null
            }).then((response) => response.json())
            .then((responseJson) => {
               // Handle no data
               if (responseJson.items == null) {
                  failure();
                  console.log("Failed!", responseJson);
                  return;
               }

               // Get today...
               let now = new Date();
               // ... aka the beginning of today

               // Get next week
               let weekFromNow = new Date();
               weekFromNow.setDate(now.getDate() + 6);
               // At the end of the day
               weekFromNow.setHours(23, 59, 59);

               let weekend = new Date();
               weekend.setDate(now.getDate() + (7 - now.getDay()))
               weekend.setHours(23, 59, 59);

               let midnight = new Date();
               midnight.setHours(23, 59, 59);
               if (now.getHours() < 4) {
                  now.setDate(now.getDate() - 1);
                  now.setHours(23, 59, 59);
                  midnight.setDate(midnight.getDate() - 1);
               }

               // Filter events so they fit between those days
               var events = responseJson.items.filter((event) => {
                  event.today = false;
                  if (event.status != "confirmed") {
                     return false
                  }

                  event.startDate = new Date(event.start.dateTime);
                  event.endDate = new Date(event.end.dateTime);

                  if (event.recurrence == undefined || event.recurrence.length == 0) {
                     event.nextWeek = event.startDate > weekend;
                     event.today = event.startDate > now && event.startDate < midnight;
                     return event.startDate > now && event.startDate < weekFromNow;
                  }

                  let numDaysDiff = DifferenceInDays(event.startDate, now);

                  let recurrence = event.recurrence[0];
                  let parts = recurrence.replace("RRULE:", "").split(';');

                  let obj = {}

                  parts.forEach((part) => {
                     let strings = part.split("=");
                     // Now I will parse the information the best I can

                     if (strings[0] == "COUNT") {
                        let count = parseInt(strings[1]);
                        let lastDuplicate = new Date(event.start.dateTime);
                        lastDuplicate.setDate(event.startDate.getDate() + 7 * count);

                        obj.lastDuplicate = lastDuplicate;
                     }else if (strings[0] == "FREQ") {
                        obj.frequency = strings[1];
                     }else if (strings[0] == "UNTIL") {
                        let year = strings[1].substring(0,4);
                        let month = strings[1].substring(4,6);
                        let day = strings[1].substring(6,8);

                        obj.lastDuplicate = new Date(year, month-1, day);
                        obj.lastDuplicate.setHours(event.startDate.getHours(), event.startDate.getMinutes());
                     }else if (strings[0] == "BYDAY") {
                        obj.day = strings[1];
                     }else{
                        obj[strings[0]] = strings[1];
                     }
                  })

                  if (now > obj.lastDuplicate) {
                     // The last occurence of this event has passed
                     return false;
                  }else{
                     // Before end. Check time
                     event.startDate.setDate(event.startDate.getDate() + 7 * Math.ceil(numDaysDiff / 7));
                     event.endDate.setDate(event.endDate.getDate() + 7 * Math.ceil(numDaysDiff / 7));

                     event.today = event.startDate > now && event.startDate < midnight;
                     event.nextWeek = event.startDate > weekend;

                     return event.startDate > now && event.startDate < weekFromNow;
                  }
               });

               // Sort by date (soonest first)
               events.sort((event1, event2) => {
                  return event1.startDate > event2.startDate ? 1 : -1
               });

               // Return them
               success(events);
            }).catch((error) => {
               console.log(error);
               failure(error);
            });
         }).catch((error) => {
            console.log(error);
         });
      });
   }

   /// Query the server for Tim's location
   getTimLocation() {
      if (this.user != null) {
         return fetch(env.timLocationInfoURL, {method: "GET"})
         .then((response) => response.json()).catch((error) => {
            console.log(error);
         })
      }
   }

   /// Query the server for the location of sharing members
   getSharedMembersInLab() {
      if (this.user != null) {
         return fetch(env.sharedLabURL, {method: "GET"})
         .then((response) => response.json()).catch((error) => {
            console.log(error);
         })
      }
   }

   /// Handle enter exit event
   enterExitDALI=(inDALI) => {

      // Get the user
      GoogleSignin.currentUserAsync().then((user) => {
         if (user == null) {
            throw "Not posting because there is no user";
         }
         this.user = user
         // Get sharing preference
         return StorageController.getLabPresencePreference();
      }).then((share) => {
         const user = this.user;
         console.log(user);
         // Post...
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
         }).catch((error) => {
            console.log(error);
         });;
      }).then((response) => {
         // Done
         console.log(response);
      }).catch((error) => {
         // Failed to connect. Ignoring...
         console.log(error)
      });

      // As well if the user is Tim, we will post for him
      this.postForTim("DALI", inDALI);
   }

   timsOfficeListener=(enter) => {
      console.log((enter ? "Entered" : "Exited") + " tim's office!")

      // TODO: Force check for lab

      this.postForTim("OFFICE", enter);
   }

   /// Posts the location info given to the server
   postForTim(location, enter) {
      if (this.user != null && GlobalFunctions.userIsTim()) {
         this.post(env.timLocationInfoURL, {location: location, enter: enter})
         .then((response) => response.json()).then((responseJson) => {

         }).catch((error) => {
            // Failed...
         });
      }
   }
}

export default ServerCommunicator;
