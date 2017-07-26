/**
ServerCommunicator.js
Deals with connecting to the internet, getting data from it, parsing it, and filtering it for the rest of the application.
Also sets up listeners for checkin's, enter, exit, and tim's office, sending relevant information to the server

AUTHOR: John Kotz
*/

import { NativeModules } from 'react-native';

const { RNGoogleSignin } = NativeModules;
import { GoogleSignin } from 'react-native-google-signin';


const env = require('./Environment');
const StorageController = require('./StorageController').default;
const GlobalFunctions = require('./GlobalFunctions').default;
const ApiUtils = require('./ApiUtils').default;

const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const debugging = false;

function DifferenceInDays(firstDate, secondDate) {
   return Math.round((secondDate - firstDate) / (1000 * 60 * 60 * 24));
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
         throw 'Can\'t create more than one instance of ServerCommunicator at a time';
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
            this.postForTim('DALI', this.beaconController.inDALI);
         });
      }

      // To get current locations
      this.beaconController.startRanging();

      // Save this is current
      ServerCommunicator.current = this;

      GoogleSignin.currentUserAsync((user) => {
         this.user = user;
      });
   }

   // / On a checkin event
   checkIn=(entering) => {
      if (!entering) {
         // Again, experimental system
         this.awaitingUser = false;
      } else {
         const user = this.user;
         if (user != null) {
            // Post checkin
            this.postCheckin(user).then((response) => {
               this.beaconController.checkInComplete();
            });
         } else {
            // We didnt get a user... I am going to try to wait for sign in
            GoogleSignin.currentUserAsync().then((user) => {
               if (user === null) {
                  // Experimental...
                  this.awaitingUser = true;
               } else {
                  this.postCheckin(user).then((response) => {
                     this.beaconController.checkInComplete();
                  }).catch((response) => {
                     // Failed to connect. Ignore...
                  });
               }
            });
         }
      }
   }

   // Called when the user changes their sharing preferences. I will notify the server using the enter exit post system
   updateSharePreference(share) {
      this.enterExitDALI(this.beaconController.inDALI);
   }

   // / Posts to the relevant data to the relevant server
   postCheckin(user) {
      if (user != null) {
         return this.post(env.checkInURL, { username: user.email });
      }
      return new Promise(((resolve, reject) => {
         reject('User is not a DALI member');
      }));
   }

   // / On login
   loggedIn(user) {
      // In case notifications aren't setup
      this.beaconController.setUpNotifications();
      // If I log in after trying to check in, then I will do my best to delay this action till the login
      if (this.awaitingUser) {
         this.checkIn(true);
      }

      // Post inDALI stuff
      if (this.beaconController.inDALI) {
         this.enterExitDALI();
      }

      GoogleSignin.currentUserAsync((user) => {
         this.user = user;
      });
   }

   // / Returns a string to be added to any voting request that will allow the server to validate the identity of the device
   authString() {
      return `?key=${env.apiKey}`;
   }

   /**
   * Queries the server for the event happening at the mmoment
   * Rejects with an error object if the server returns an error
   */
   getEventNow() {
      // Generating the url
      const url = env.voting.currentURL + this.authString();

      // Get
      return fetch(url, { method: 'GET' })
      .then(ApiUtils.checkStatus) // This will search the response for error indicators and throw if there are problems
      .then((response) => {
         // Handle the response
         return new Promise(function (resolve, reject) {
            response.json().then((responseJson) => {
               // Saving the event in case I need it later
               this.event = responseJson;
               resolve(responseJson);
            }).catch((error) => {
               reject(error);
            });
         });
      });
   }

   /**
   * Queries the server for the event happening now, but it won't strip the scores before returning them
   * NOTE: Only admins can access scores
   */
   getEventNowWithScores() {
      if (this.user === null || !GlobalFunctions.userIsAdmin()) {
         // Autoreject
         return new Promise(((resolve, reject) => { reject(); }));
      }

      return fetch(env.voting.currentResultsURL + this.authString(), { method: 'GET' })
      .then(ApiUtils.checkStatus).then((response) => { return response.json(); });
   }

   /**
   * Creates a new event on the server with the given object as a guide
   */
   submitNewEvent(event) {
      return this.post(env.voting.createURL + this.authString(), event, 'POST', true)
      .then(ApiUtils.checkStatus);
   }

   /**
   * Release the currently saved awards
   * NOTE: Only admins may call this function
   */
   releaseAwards(event) {
      if (this.user === null || !GlobalFunctions.userIsAdmin()) {
         // Autoreject
         return new Promise(((resolve, reject) => { reject(); }));
      }

      return this.post(
         env.voting.releaseURL + this.authString(),
         { event: event.id },
      )
      .then(ApiUtils.checkStatus);
   }

   /**
   * Saves the given set of awards on the server
   * NOTE: Only admins may call this function.
   */
   saveAwards(awards, event) {
      if (this.user === null || !GlobalFunctions.userIsAdmin()) {
         // Autoreject
         return new Promise(((resolve, reject) => { reject(); }));
      }

      return this.post(env.voting.awardsSavingURL + this.authString(), {
         event: event.id,
         winners: awards,
      }).then(ApiUtils.checkStatus);
   }

   /**
   * Pulls the voting results for the current event from the server
   */
   getVotingResults() {
      return fetch(env.voting.finalResultsURL + this.authString(), { method: 'GET' })
      .then(ApiUtils.checkStatus).then((response) => { return response.json(); });
   }

   /**
   * Submits the given ids as votes
   * PARAMETERS:
   *  - first: First choice (id)
   *  - second: Second choice (id)
   *  - third: Third choice (id)
   */
   submitVotes(first, second, third, event) {
      return this.post(env.voting.submitURL + this.authString(), {
         event: event.id,
         first,
         second,
         third,
         user: this.user.email,
      }, 'POST', true);
   }

   // / Simple convenience post method
   post(path, params, method, allowNoUser) {
      // I allow the caller to pass a flag that bypasses the user check for the given post
      if (this.user != null || allowNoUser) {
         console.log(`Posting to: ${path}`);
         return fetch(path, {
            method: method || 'POST',
            headers: {
               Accept: 'application/json',
               'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
         }).then(ApiUtils.checkStatus);
      }
      return new Promise(((resolve, reject) => {
         reject('Can\'t post if you are not a member');
      }));
   }

   // / Calls getLabHours and filters it by those still tonight
   getTonightsLabHours() {
      const prefix = '> getTonightsLabHours: ';
      if (debugging) { console.log('Running getTonightsLabHours...'); }

      return new Promise((resolve, reject) => {
         this.getLabHours().then((hours) => {
            if (debugging) { console.log(`${prefix}Got back:`, hours); }
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(23, 59, 59);
            if (now.getHours() < 4) {
               now.setDate(now.getDate() - 1);
               now.setHours(23, 59, 59);
               midnight.setDate(midnight.getDate() - 1);
            }

            const taHours = hours.filter((hour) => {
               const innerPrefix = `==${prefix}${hour.name}: `;
               if (hour.status !== 'confirmed') {
                  return false;
               }

               // This method worked for the first week, but no longer!
               // Because we only get one event for each that recurrs
               if (hour.recurrence === undefined || hour.recurrence.length === 0) {
                  if (debugging) {
                     console.log(`${innerPrefix}No recurrence`);
                     console.log(`${innerPrefix}Should show:`, (hour.startDate > now || hour.endDate > now && hour.startDate < now) && hour.startDate <= midnight);
                  }
                  return (hour.startDate > now || hour.endDate > now && hour.startDate < now) && hour.startDate <= midnight;
               }

               // This new method should determine what day of the week the
               const numDaysDiff = DifferenceInDays(hour.startDate, now);
               if (debugging) { console.log(`${innerPrefix}Num days diff:`, numDaysDiff); }

               const recurrence = hour.recurrence[0];
               const parts = recurrence.replace('RRULE:', '').split(';');
               //const freq = parts[0].replace('FREQ=', '');
               const count = parseInt(parts[1].replace('COUNT=', ''), 10);
               const day = parts[2].replace('BYDAY=', '');

               const lastDuplicate = new Date(hour.end.dateTime);
               lastDuplicate.setDate(hour.startDate.getDate() + 7 * count);

               if (now > lastDuplicate) {
                  // The last occurence of this event has passed

                  if (debugging) { console.log(`${innerPrefix}Past expiration`); }
                  return false;
               } else if (days[now.getDay()] !== day) {
                  // Not the right day of the week
                  if (debugging) { console.log(`${innerPrefix}Not today!`); }
                  return false;
               } else {
                  // Right day of week. Check time
                  if (debugging) { console.log(`${innerPrefix}Correct day`); }

                  const thisWeeksEndTime = new Date(hour.end.dateTime);
                  thisWeeksEndTime.setDate(thisWeeksEndTime.getDate() + numDaysDiff);

                  if (debugging) {
                     console.log(`${innerPrefix}Now is:`, now);
                     console.log(`${innerPrefix}Ends at:`, thisWeeksEndTime);
                  }

                  const shouldShow = thisWeeksEndTime > now;
                  if (debugging) { console.log(`${innerPrefix}Should show:`, shouldShow); }
                  return shouldShow;
               }
            });

            let i = 0;
            while (i < taHours.length) {
               const hour = taHours[i];
               const otherI = findWithAttr(taHours, 'id', hour.id, i);

               if (otherI !== -1) {
                  if (debugging) { console.log(`${prefix}Found duplicate`, otherI, 'to', i); }
                  const otherHour = taHours[otherI];
                  taHours.splice(otherI, 1);

                  if (otherHour.skills != null) {
                     hour.skills = otherHour.skills;
                  }
                  hour.duplicate = otherHour;
               }
               i++;
            }

            taHours.sort((hour1, hour2) => {
               return hour1.startDate > hour2.startDate;
            });

            resolve(taHours);
         }).catch((error) => {
            reject(error);
         });
      });
   }

   // Gets the lab hours listed on the Google Calendar
   getLabHours() {
      const prefix = '==> getLabHours: ';
      if (debugging) { console.log('Running getLabHours'); }
      return GoogleSignin.currentUserAsync().then((user) => {
         if (user === null) {
            return new Promise(((resolve, reject) => {
               reject();
            }));
         }
         this.user = user;

         // I can access the calendar
         return new Promise(function (resolve, reject) {
            // There is some wierd accessToken stuff on Android, so I will check if I have it...
            this.accessToken = this.accessToken === undefined ? user.accessToken : this.accessToken;
            if (debugging) { console.log(`${prefix}Access token?`, this.accessToken); }

            if (this.accessToken === undefined) {
               if (debugging) { console.log(`${prefix}Nope...`); }
               // If not, I will request it...
               RNGoogleSignin.getAccessToken(user).then((token) => {
                  // Save it...
                  this.accessToken = token;

                  if (debugging) {
                     console.log(`${prefix}New one?`, this.accessToken);
                     // And start the function over
                     console.log(`${prefix}Starting over...`);
                  }
                  this.getLabHours().then(() => {
                     resolve(...arguments);
                  }).catch(() => {
                     reject(...arguments);
                  });
               }).catch(() => {
                  reject(...arguments);
               });
            }

            if (debugging) { console.log(`${prefix}Yup!`); }

            // Now that I have the token...
            const accessToken = this.accessToken;
            if (debugging) { console.log(`${prefix}Fetching calendar...`); }
            fetch(`https://www.googleapis.com/calendar/v3/calendars/${env.taCalendarId}/events`, {
               method: 'GET',
               headers: {
                  Authorization: `Bearer ${accessToken}`,
               },
            }).then((response) => { return response.json(); })
            .then((responseJson) => {
               if (debugging) { console.log(`${prefix}Got it:`, responseJson); }

               // Handle no data
               if (responseJson === null || responseJson.items === null) {
                  console.log(responseJson);
                  reject('No data!');
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

   // / Gets the events in the next week
   getUpcomingEvents() {
      return new Promise((success, failure) => {
         GoogleSignin.currentUserAsync().then((user) => {
            if (user != null) {
               this.accessToken = this.accessToken === undefined ? user.accessToken : this.accessToken;


               if (this.accessToken === undefined) {
                  return GoogleSignin.hasPlayServices({ autoResolve: true }).then(() => {
                     return GoogleSignin.currentUserAsync();
                  }).then((user) => {
                     return RNGoogleSignin.getAccessToken(user);
                  }).then((token) => {
                     this.accessToken = token;
                     this.getUpcomingEvents().then(() => {
                        success.apply(arguments);
                     }).catch(() => {
                        failure.apply(arguments);
                     });
                  });
               }
            }

            const accessToken = this.accessToken;

            fetch(`https://www.googleapis.com/calendar/v3/calendars/${user != null ? env.eventsCalendarId : env.publicEventsCalendarId}/events${user === null ? `?key=${env.googleConfig.publicKey}` : ''}`, {
               method: 'GET',
               headers: user != null ? {
                  Authorization: `Bearer ${accessToken}`,
               } : null,
            }).then((response) => { return response.json(); })
            .then((responseJson) => {
               // Handle no data
               if (responseJson.items === null) {
                  failure();
                  console.log('Failed!', responseJson);
                  return;
               }

               // Get today...
               const now = new Date();
               // ... aka the beginning of today

               // Get next week
               const weekFromNow = new Date();
               weekFromNow.setDate(now.getDate() + 6);
               // At the end of the day
               weekFromNow.setHours(23, 59, 59);

               const weekend = new Date();
               weekend.setDate(now.getDate() + (7 - now.getDay()));
               weekend.setHours(23, 59, 59);

               const midnight = new Date();
               midnight.setHours(23, 59, 59);
               if (now.getHours() < 4) {
                  now.setDate(now.getDate() - 1);
                  now.setHours(23, 59, 59);
                  midnight.setDate(midnight.getDate() - 1);
               }

               // Filter events so they fit between those days
               const events = responseJson.items.filter((event) => {
                  event.today = false;
                  if (event.status !== 'confirmed') {
                     return false;
                  }

                  event.startDate = new Date(event.start.dateTime);
                  event.endDate = new Date(event.end.dateTime);

                  if (event.recurrence === undefined || event.recurrence.length === 0) {
                     event.nextWeek = event.startDate > weekend;
                     event.today = event.startDate > now && event.startDate < midnight;
                     return event.startDate > now && event.startDate < weekFromNow;
                  }

                  const numDaysDiff = DifferenceInDays(event.startDate, now);

                  const recurrence = event.recurrence[0];
                  const parts = recurrence.replace('RRULE:', '').split(';');

                  const obj = {};

                  parts.forEach((part) => {
                     const strings = part.split('=');
                     // Now I will parse the information the best I can

                     if (strings[0] === 'COUNT') {
                        const count = parseInt(strings[1], 10);
                        const lastDuplicate = new Date(event.start.dateTime);
                        lastDuplicate.setDate(event.startDate.getDate() + 7 * count);

                        obj.lastDuplicate = lastDuplicate;
                     } else if (strings[0] === 'FREQ') {
                        obj.frequency = strings[1];
                     } else if (strings[0] === 'UNTIL') {
                        const year = strings[1].substring(0, 4);
                        const month = strings[1].substring(4, 6);
                        const day = strings[1].substring(6, 8);

                        obj.lastDuplicate = new Date(year, month - 1, day);
                        obj.lastDuplicate.setHours(event.startDate.getHours(), event.startDate.getMinutes());
                     } else if (strings[0] === 'BYDAY') {
                        obj.day = strings[1];
                     } else {
                        obj[strings[0]] = strings[1];
                     }
                  });

                  if (now > obj.lastDuplicate) {
                     // The last occurence of this event has passed
                     return false;
                  } else {
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
                  return event1.startDate > event2.startDate ? 1 : -1;
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

   // / Query the server for Tim's location
   getTimLocation() {
      if (this.user != null) {
         return fetch(env.timLocationInfoURL, { method: 'GET' })
         .then((response) => { return response.json(); }).catch((error) => {
            console.log(error);
         });
      }
   }

   // / Query the server for the location of sharing members
   getSharedMembersInLab() {
      if (this.user != null) {
         return fetch(env.sharedLabURL, { method: 'GET' })
         .then((response) => { return response.json(); }).catch((error) => {
            console.log(error);
         });
      }
   }

   // / Handle enter exit event
   enterExitDALI=(inDALI) => {
      // Get the user
      GoogleSignin.currentUserAsync().then((user) => {
         if (user === null) {
            throw 'Not posting because there is no user';
         }
         this.user = user;
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
               name: user.name,
            },
            inDALI,
            share,
         }).catch((error) => {
            console.log(error);
         });
      }).then((response) => {
         // Done
         console.log(response);
      }).catch((error) => {
         // Failed to connect. Ignoring...
         console.log(error);
      });

      // As well if the user is Tim, we will post for him
      this.postForTim('DALI', inDALI);
   }

   timsOfficeListener=(enter) => {
      console.log(`${enter ? 'Entered' : 'Exited'} tim's office!`);

      // TODO: Force check for lab

      this.postForTim('OFFICE', enter);
   }

   // / Posts the location info given to the server
   postForTim(location, enter) {
      if (this.user != null && GlobalFunctions.userIsTim()) {
         this.post(env.timLocationInfoURL, { location, enter })
         .then((response) => { return response.json(); }).then((responseJson) => {

         }).catch((error) => {
            // Failed...
         });
      }
   }
}

function findWithAttr(array, attr, value, not) {
   for (let i = 0; i < array.length; i += 1) {
      if (array[i][attr] === value && i !== not) {
         return i;
      }
   }
   return -1;
}

export default ServerCommunicator;
