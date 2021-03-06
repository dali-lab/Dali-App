/**
ServerCommunicator.js
Deals with connecting to the internet, getting data from it, parsing it, and filtering it for the rest of the application.
Also sets up listeners for checkin's, enter, exit, and tim's office, sending relevant information to the server

AUTHOR: John Kotz
*/

import { NativeModules, Platform } from 'react-native';

import { GoogleSignin } from 'react-native-google-signin';

const { RNGoogleSignin } = NativeModules;
const env = require('./Environment');
const StorageController = require('./StorageController').default;
const GlobalFunctions = require('./GlobalFunctions').default;
const ApiUtils = require('./ApiUtils').default;


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
       throw new Error('Can\'t create more than one instance of ServerCommunicator at a time');
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
     // this.beaconController.startRanging();

     this.userObject = null;
     this.serverToken = null;

     // Save this is current
     ServerCommunicator.current = this;

     GoogleSignin.currentUserAsync((user) => {
       this.user = user;
     });
   }

   // On a checkin event
   checkIn=(entering) => {
     if (!entering) {
       // Again, experimental system
       this.awaitingUser = false;
     } else {
       const { user } = this;
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
     StorageController.getToken().then((token) => {
       this.post(`${env.serverURL}/api/location/shared/updatePreference`, { sharing: share }, 'POST', token);
     });
   }

   // Posts to the relevant data to the relevant server
   postCheckin(user) {
     if (user != null) {
       return this.post(`${env.serverURL}/api/events/checkin`, { username: user.email });
     }
     return new Promise(((resolve, reject) => {
       reject(new Error('User is not a DALI member'));
     }));
   }

   getAccessToken(user) {
     return new Promise((resolve, reject) => {
       // If not, I will request it...
       if (Platform.OS !== 'ios') {
         RNGoogleSignin.getAccessToken(user).then((token) => {
           // Save it...
           this.accessToken = token;
           resolve(token);
         });
       } else {
         resolve(user.accessToken);
       }
     });
   }

   signin(gUser) {
     return new Promise((resolve, reject) => {
       fetch(`${env.serverURL}/api/auth/google/callback?code=${gUser.serverAuthCode}`, { method: 'GET' })
         .then(ApiUtils.checkStatus)
         .then(responseJson => new Promise((resolve, reject) => {
           console.log(responseJson);
           resolve(responseJson);
         }))
         .then(responseJson => responseJson.json())
         .then((response) => {
           console.log('Made it past response processing...');
           this.serverToken = response.token;
           this.userObject = response.user;

           this.beaconController.setUpNotifications();

           console.log('Saving token...');
           StorageController.saveToken(response.token);
           // .then(() => {
           console.log('Token saved!');
           console.log('Doing following opperations...');
           if (this.awaitingUser) {
             this.checkIn(true);
           }

           if (this.beaconController.inDALI) {
             this.enterExitDALI();
           }
           console.log('Resolving');
           resolve();
           // }).catch((error) => {
           //   console.log('Failed token or following opperations!');
           //   reject(error);
           // });
         })
         .catch((error) => {
           console.log('Load failed!');
           reject(error);
         });
     });
   }

   loadTokenAndUser(gUser, logout) {
     const googleUser = gUser || GoogleSignin.currentUser();
     console.log('Loading token and user');

     return new Promise((resolve, reject) => {
       if (this.serverToken && this.userObject) {
         resolve(this.serverToken);
       }

       StorageController.getToken().then((token) => {
         if (token) {
           console.log('GOT TOKEN', token);
           this.serverToken = token;
           fetch(`https://dalilab-api.herokuapp.com/api/users/${googleUser.id}?isGoogle=true`, {
             method: 'GET',
             headers: {
               authorization: token,
             },
           })
             .then(responseJson => responseJson.json())
             .then((user) => {
               this.userObject = user;
               resolve(token);
             }).catch((error) => {
               if (logout) logout();
               console.log(error);
               reject(error);
             });
         } else {
           if (logout) logout();
           console.log('Failed to get token');
           reject();
         }
       });
     });
   }

   /**
   * Queries the server for the event happening at the mmoment
   * Rejects with an error object if the server returns an error
   */
   getEventsNow() {
     // Get
     return fetch(`${env.serverURL}/api/voting/public/current`, {
       method: 'GET'
     })
       .then(ApiUtils.checkStatus) // This will search the response for error indicators and throw if there are problems
       .then(response => response.json())
       .then((responseJson) => {
         // Saving the event in case I need it later
         this.event = responseJson;
         return new Promise((resolve, reject) => {
           if (responseJson == null || responseJson.length === 0) {
             reject(new Error({ code: 404 }));
             return;
           }
           resolve(responseJson);
         });
       });
   }

   getHaveVotedForEvent(event) {
     return fetch(`${env.serverURL}/api/voting/public/${event.id}/hasVoted`)
       .then(ApiUtils.checkStatus)
       .then(response => response.json())
       .then(responseJson => new Promise(((resolve, reject) => {
         resolve(responseJson.voted || false);
       })));
   }

   getPastEvents() {
     return fetch(`${env.serverURL}/api/voting/public`, {
       method: 'GET'
     })
       .then(ApiUtils.checkStatus) // This will search the response for error indicators and throw if there are problems
       .then(response => response.json())
       .then(responseJson => new Promise((resolve, reject) => {
         if (responseJson == null || responseJson.length === 0) {
           reject(new Error({ code: 404 }));
           return;
         }
         resolve(responseJson);
       }));
   }

   getOptionsForVotingEvent(event) {
     return fetch(`${env.serverURL}/api/voting/public/${event.id}`, {
       method: 'GET'
     })
       .then(ApiUtils.checkStatus)
       .then(response => response.json())
       .then(response => new Promise(((resolve, reject) => {
         if (response == null || response.length === 0) {
           reject(new Error({ code: 404 }));
           return;
         }
         resolve(response);
       })));
   }

   /**
   * Submits the given ids as votes
   */
   submitVotes(options, event) {
     return this.post(`${env.serverURL}/api/voting/public/${event.id}`, options, 'POST')
       .then(ApiUtils.checkStatus);
   }

   // / Simple convenience post method
   post(path, params, method, token) {
     // I allow the caller to pass a flag that bypasses the user check for the given post
     console.log(`Posting to: ${path}`, {
       method: method || 'POST',
       headers: {
         Accept: 'application/json',
         'Content-Type': 'application/json',
         authorization: token || this.serverToken
       },
       body: JSON.stringify(params),
     });
     return fetch(path, {
       method: method || 'POST',
       headers: {
         Accept: 'application/json',
         'Content-Type': 'application/json',
         authorization: token || this.serverToken
       },
       body: JSON.stringify(params),
     }).then(ApiUtils.checkStatus);
   }

   // / Gets the events in the next week
   getUpcomingEvents() {
     return new Promise((resolve, reject) => {
       this.loadTokenAndUser().then(token => fetch(`${env.serverURL}/api/events/week`, {
         method: 'GET',
         headers: {
           authorization: token,
         },
       })).then(responseJson => responseJson.json()).then((response) => {
         response.forEach((event) => {
           event.startDate = new Date(event.startTime);
           event.endDate = new Date(event.endTime);

           event.summary = event.name;
         });

         resolve(response);
       })
         .catch(() => {
           fetch(`${env.serverURL}/api/events/public/week`)
             .then((responseJson => responseJson.json()))
             .then((response) => {
               response.forEach((event) => {
                 event.startDate = new Date(event.startTime);
                 event.endDate = new Date(event.endTime);

                 event.summary = event.name;
               });

               resolve(response);
             });
         });
     });
   }

   // / Query the server for Tim's location
   getTimLocation() {
     return StorageController.getToken().then(token => fetch(`${env.serverURL}/api/location/tim`, {
       method: 'GET',
       headers: {
         authorization: token,
       },
     })).then(response => response.json()).catch((error) => {
       console.log(error);
     });
   }

   // / Query the server for the location of sharing members
   getSharedMembersInLab() {
     return StorageController.getToken().then(token => fetch(`${env.serverURL}/api/location/shared`, {
       method: 'GET',
       headers: {
         authorization: token,
       },
     })).then(response => response.json()).catch((error) => {
       console.log(error);
     });
   }

   // / Handle enter exit event
   enterExitDALI=(inDALI) => {
     // Get the user
     GoogleSignin.currentUserAsync().then((user) => {
       if (user === null) {
         throw new Error('Not posting because there is no user');
       }
       this.user = user;
       // Get sharing preference
       return this.loadTokenAndUser(user);
     })
       .then(() => StorageController.getLabPresencePreference())
       .then((share) => {
         console.log(this.serverToken);
         const serverUser = this.userObject;
         console.log(serverUser.id);
         // Post...
         return this.post(`${env.serverURL}/api/location/shared`, {
           user: serverUser.id,
           inDALI: inDALI || this.beaconController.inDALI,
           sharing: share,
           entering: inDALI,
           exiting: !inDALI
         })
           .catch((error) => {
             console.log(error);
           });
       })
       .then((response) => {
       // Done
         console.log(response);
       })
       .catch((error) => {
       // Failed to connect. Ignoring...
         console.log(error);
       });

     // As well if the user is Tim, we will post for him
     this.postForTim('DALI', inDALI);
   }

   timsOfficeListener=(enter) => {
     console.log((enter ? 'Entered' : 'Exited') + " tim's office!");

     // TODO: Force check for lab

     this.postForTim('OFFICE', enter);
   }

   // / Posts the location info given to the server
   postForTim(location, enter) {
     if (this.user != null && GlobalFunctions.userIsTim()) {
       let inDALI = null;
       let inOffice = null;

       if (location === 'DALI') {
         inDALI = enter;
       } else if (location === 'OFFICE') {
         inOffice = enter;
       }

       this.loadTokenAndUser(this.user).then(() => this.post(`${env.serverURL}/api/location/tim`, {
         user: this.serverUser.id,
         inDALI,
         inOffice
       }))
         .then(response => response.json()).then((responseJson) => {

         })
         .catch((error) => {
         // Failed...
         });
     }
   }
}

export default ServerCommunicator;
