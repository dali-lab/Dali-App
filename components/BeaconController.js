/**
BeaconController.js
Deals with ALL the location information, and provides listener options for this data

REALLY IMPORANT FILE

AUTHOR: John Kotz
*/
import Beacons from 'react-native-beacons-manager';
import PushNotification from 'react-native-push-notification';
import BackgroundTimer from 'react-native-background-timer';
import {
  DeviceEventEmitter,
  Platform
} from 'react-native';
import { GoogleSignin } from 'react-native-google-signin';

// My other modules
const StorageController = require('./StorageController').default;
const GlobalFunctions = require('./GlobalFunctions').default;
const ServerCommunicator = require('./ServerCommunicator').default;
const env = require('./Environment');

const outOfLabPriority = 1;
const inLabPriority = 2;
const timsOfficePriority = 3;
const votingEventPriority = 4;

/**
Controlls the location data in the background of the app.

STATIC:
- current: Reference to the application's current BeaconController object
- inDALI: Function that returns Bool of if device is in DALI lab

TODO:
- Debug background missing entry/exit
*/
class BeaconController {
 static current = null;
 static inDALI() {
   return BeaconController.current.inDALI;
 }

 constructor() {
   // Making sure I have no doplegangers
   if (BeaconController.current != null) {
     throw new Error('Cannot create more than one BeaconController!');
   }

   if (Platform.OS === 'ios') {
     // iOS has its own way of doing things...
     // For one, Android doesn't ask for permission from the user
     Beacons.requestAlwaysAuthorization();
     Beacons.requestWhenInUseAuthorization();

     this.authorization = null;
     Beacons.getAuthorizationStatus(function (authorization) {
       // authorization is a string which is either "authorizedAlways",
       // "authorizedWhenInUse", "denied", "notDetermined" or "restricted"
       this.authorization = authorization;
       console.log(`Got authorization: ${authorization}`);
     });

     console.log('Starting monitoring...');
     // For the other iOS only requires the object { identifier: "Some ID", uuid: "long-string-ofcharacters" }
     Beacons.startMonitoringForRegion(env.labRegion);
     Beacons.startMonitoringForRegion(env.checkInRegion);
     // Beacons.startMonitoringForRegion(env.votingRegion);
     Beacons.startUpdatingLocation();
   } else {
     // Android needs explicit declaration of type of beacon detected
     Beacons.detectIBeacons();
     Beacons.detectEstimotes();

     // Android needs major and minor values
     env.labRegion.major = 1;
     env.labRegion.minor = 1;

     env.checkInRegion.major = 1;
     env.checkInRegion.minor = 1;

     env.votingRegion.major = 1;
     env.votingRegion.minor = 1;

     // Android may fail!
     Beacons.startMonitoringForRegion(env.labRegion).then(() => {
       console.log('Started monitoring', env.labRegion);
     }).catch((error) => {
       console.log('Failed to start monitoring!', error);
     });
     Beacons.startMonitoringForRegion(env.checkInRegion).then(() => {
       console.log('Started monitoring', env.checkInRegion);
     }).catch((error) => {
       console.log('Failed to start monitoring!', error);
     });
     // Beacons.startMonitoringForRegion(env.votingRegion).then(() => {
     // 	console.log("Started monitoring", env.votingRegion);
     // }).catch((error) => {
     // 	console.log("Failed to start monitoring!", error);
     // });
   }

   // Store the current thought of where the device is in relation to DALI
   this.inDALI = false;
   this.inVotingEvent = false;
   this.votingEventMajor = null;
   this.locationTextCurrentPriority = 0;

   // Listeners for the various events I monitor
   this.enterExitListeners = [];
   this.beaconRangeListeners = [];
   this.timsOfficeListeners = [];
   this.checkInListeners = [];
   this.votingRegionListeners = [];
   this.locationInformationListeners = [];

   // To make sure I don't set up Tim's Office region twice
   this.setUpTimsOffice = false;
   // To give the Main screen something to look at in case I already have the data
   this.rangedDALI = false;

   // Now that setup is complete I can save this controller as the active controller
   BeaconController.current = this;

   // Set up the listeners for the monitored beacons
   this.enterListener = DeviceEventEmitter.addListener('regionDidEnter', this.didEnterRegion.bind(this));
   this.exitListener = DeviceEventEmitter.addListener('regionDidExit', this.didExitRegion.bind(this));
 }

 setUpNotifications() {
   PushNotification.configure({

     // (optional) Called when Token is generated (iOS and Android)
     onRegister(token) {
     },

     // (required) Called when a remote or local notification is opened or received
     onNotification(notification) {
       /* Remote notification in this form:
				* {
				*  foreground: false, // BOOLEAN: If the notification was received in foreground or not
				*  userInteraction: false, // BOOLEAN: If the notification was opened by the user from the notification area or not
				*  message: 'My Notification Message', // STRING: The notification message
				*  data: {}, // OBJECT: The push data
				* }
				*/
       console.log( 'NOTIFICATION:', notification );
     },

     // ANDROID ONLY: GCM Sender ID (optional - not required for local notifications, but is need to receive remote push notifications)
     senderID: 'YOUR GCM SENDER ID',

     // IOS ONLY (optional): default: all - Permissions to register.
     permissions: {
       alert: true,
       badge: true,
       sound: true
     },

     // Should the initial notification be popped automatically
     // default: true
     popInitialNotification: true,

     /**
			* (optional) default: true
			* - Specified if permissions (ios) and token (android and ios) will requested or not,
			* - if not, you must call PushNotificationsHandler.requestPermissions() later
			*/
     requestPermissions: true,
   });
 }

  /**
	* Enable beacon ranging
	*/
 startRanging() {
   // To track the number of times I get beacons before I force cancel ranging
   // Helped a bit towards infinite ranging problem
   this.numRanged = 0;

   // Again Android does things differently
   if (Platform.OS === 'ios') {
     Beacons.startUpdatingLocation();
     Beacons.startRangingBeaconsInRegion(env.labRegion);
     console.log('Starting to range DALI');
   } else {
     Beacons.startRangingBeaconsInRegion(env.labRegion.identifier, env.labRegion.uuid).then(() => {
       console.log('Started ranging');
     }).catch((error) => {
       console.log('Failed to range');
       console.log(error);
       // Failed to range, report not in the lab
       BeaconController.performCallbacks(this.enterExitListeners, false);
     });
   }

   if (this.rangingListener === null) {
     this.rangingListener = DeviceEventEmitter.addListener('beaconsDidRange', this.beaconsDidRange.bind(this));
   }
 }

  /**
	* Stop ranging
	*/
 stopRanging() {
   // So far I have not found a great way to stop ranging beacons, so I just remove the listener
   if (this.rangingListener != null) {
     this.rangingListener.remove();
     this.rangingListener = null;
   }
   if (this.voteRangingListener != null) {
     this.voteRangingListener.remove();
     this.voteRangingListener = null;
   }
 }

  /**
	Called when the device exits a montiored region
	*/
 didExitRegion(exitRegion) {
   console.log('Exited region');
   console.log(exitRegion);

   if (exitRegion.region === env.checkInRegion.identifier || exitRegion.identifier === env.checkInRegion.identifier) {
     // If we have exited the check-in-region, so we don't want to be notified about the lab
     // We will instead deal with the check in listeners
     BeaconController.performCallbacks(this.checkInListeners, false);
     return;
   }

   // Check for Tim's office
   if (exitRegion.region === env.timsOfficeRegion.identifier || exitRegion.identifier === env.timsOfficeRegion.identifier) {
     BeaconController.performCallbacks(this.timsOfficeListeners, false);
     if (this.locationTextCurrentPriority === timsOfficePriority) {
       BeaconController.performCallbacks(this.locationInformationListeners, 'Loading location...');
       this.locationTextCurrentPriority = 0;
       this.startRanging();
     }
     return;
   }

   // Check for Voting event
   console.log(exitRegion);
   if (exitRegion.region === env.votingRegion.identifier || exitRegion.identifier === env.votingRegion.identifier) {
     this.inVotingEvent = false;
     this.votingEventMajor = null;
     BeaconController.performCallbacks(this.votingRegionListeners, false);
     if (this.locationTextCurrentPriority === votingEventPriority) {
       BeaconController.performCallbacks(this.locationInformationListeners, 'Loading location...');
       this.locationTextCurrentPriority = 0;
       this.startRanging();
     }
     return;
   }

   // I will only send enter and exit notifications if the user is signed in
   GoogleSignin.currentUserAsync().then((user) => {
     if (user != null) {
       // Plus I have to chek their preferences
       return StorageController.getLabAccessPreference();
     }
   }).then((value) => {
     // Only if they are logged in and they want to receive these notifications...
     if (value) {
       // Send a notification
       console.log('Notifying...');
       PushNotification.localNotification({
         title: 'Exited DALI',
         message: 'See you next time!'
       });
     }
   });

   // Save and notify
   this.rangedDALI = true;
   this.inDALI = false;

   if (this.locationTextCurrentPriority <= inLabPriority) {
     BeaconController.performCallbacks(this.locationInformationListeners, 'Not in DALI Lab');
     this.locationTextCurrentPriority = outOfLabPriority;
   }

   this.setUpBackgroundUpdates(this.inDALI);
   BeaconController.performCallbacks(this.enterExitListeners, this.inDALI);
 }

  /**
	Presents a notification to the user that they have been checked in
	Called by the ServerCommunicator when it has successfully checked in the user
	*/
 checkInComplete() {
   if (GoogleSignin.currentUser() != null) {
     StorageController.getCheckinNotifPreference().then((value) => {
       if (value) {
         console.log('Notifying...');
         PushNotification.localNotification({
           title:'Checked In',
           message: 'Just checked you into this event. Have fun!'
         });
       }
     });
   }
 }

  /**
	Handles entering a region.
	Called by the didEnterRegion listener I set up
	*/
 didEnterRegion(enterRegion) {
   console.log('Entered region');
   console.log(enterRegion);

   // Check for check-in
   if (enterRegion.region === env.checkInRegion.identifier || enterRegion.identifier === env.checkInRegion.identifier) {
     BeaconController.performCallbacks(this.checkInListeners, true);
     return;
   }

   // Check for Tim's office
   if (enterRegion.region === env.timsOfficeRegion.identifier || enterRegion.identifier === env.timsOfficeRegion.identifier) {
     BeaconController.performCallbacks(this.timsOfficeListeners, true);
     if (this.locationTextCurrentPriority < timsOfficePriority) {
       BeaconController.performCallbacks(this.locationInformationListeners, "In Tim's Office");
       this.locationTextCurrentPriority = timsOfficePriority;
     }
     return;
   }

   // Check for Voting events
   console.log(enterRegion);
   if (enterRegion.region === env.votingRegion.identifier || enterRegion.identifier === env.votingRegion.identifier) {
     this.inVotingEvent = true;
     this.startRanging();
     BeaconController.performCallbacks(this.votingRegionListeners, true);

     if (this.locationTextCurrentPriority < votingEventPriority) {
       ServerCommunicator.current.getEventNow().then((event) => {
         if (event === null) {
           return;
         }

         BeaconController.performCallbacks(this.locationInformationListeners, `At ${event.name}`);
         this.locationTextCurrentPriority = votingEventPriority;

         PushNotification.localNotification({
           title: event.name,
           message: `Welcome to ${event.name}!`
         });
       }).catch((error) => {
         if (error.code === 404) {

         }
       });
     }
     return;
   }

   // Check user
   GoogleSignin.currentUserAsync().then((user) => {
     if (user != null) {
       // Plus I have to check their preferences
       return StorageController.getLabAccessPreference();
     }
   }).then((value) => {
     // If both are valid, we send
     if (value) {
       console.log('Notifying...');
       PushNotification.localNotification({
         title: 'Entered DALI',
         message: 'Welcome back to DALI lab!'
       });
     }
   });

   this.rangedDALI = true;
   this.inDALI = true;

   if (this.locationTextCurrentPriority < inLabPriority) {
     BeaconController.performCallbacks(this.locationInformationListeners, 'In DALI Lab');
     this.locationTextCurrentPriority = inLabPriority;
   }

   this.setUpBackgroundUpdates(this.inDALI);
   BeaconController.performCallbacks(this.enterExitListeners, this.inDALI);
 }

 votingBeaconsDidRange(data) {
   this.inVotingEvent = data.beacons.length > 0;
   this.votingEventMajor = data.beacons.length > 0 ? data.beacons[0].major : null;
   BeaconController.performCallbacks(this.votingRegionListeners, data.beacons.length > 0);
   this.stopRanging();
   if (data.beacons.length > 0 && this.locationTextCurrentPriority < votingEventPriority) {
     ServerCommunicator.current.getEventNow().then((event) => {
       if (event === null) {
         return;
       }

       BeaconController.performCallbacks(this.locationInformationListeners, `At ${event.name}`);
       this.locationTextCurrentPriority = votingEventPriority;
     }).catch((error) => {
       if (error.code === 404) {}
     });
   }
 }

  /**
	Handles beacons that have been ranged.
	Called by beaconsDidRange listener
	*/
 beaconsDidRange(data) {
   // An attempt to stop the ranging if it gets out of controll
   if (this.numRanged > 20) {
     this.stopRanging();
     return;
   }
   this.numRanged += 1;

   /*
		Since I cannot actually range multiple regions at the same time,
		I am staggering them, such that when one finishes it will start the next.
		The order of this is:
		- DALI lab
		- Check in
		- Voting events
		- Tim's Office (only if user is Tim)

		The order of the if statements is actually the reverse of this,
		but it is the best way to default to DALI Lab region if it is an unhandled region
		*/

   // Check to see if this region is Tim's Office
   if (Platform.OS !== 'ios' ? (data.identifier === env.timsOfficeRegion.identifier) : (data.region.identifier === env.timsOfficeRegion.identifier)) {
     console.log("Tim's");
     // Get tim
     if (GlobalFunctions.userIsTim()) {
       BeaconController.performCallbacks(this.timsOfficeListeners, data.beacons.length > 0);
       if (data.beacons.length > 0 && this.locationTextCurrentPriority < timsOfficePriority) {
         BeaconController.performCallbacks(this.locationInformationListeners, "In Tim's Office");
         this.locationTextCurrentPriority = timsOfficePriority;
       }
     }
     // Since this is to be the last in the chain
     if (data.beacons.length === 0 && this.locationTextCurrentPriority === 0) {
       Beacons.startRangingBeaconsInRegion(env.labRegion);
       this.startRanging();
     } else {
       this.stopRanging();
     }
     this.setUpBackgroundUpdates(data.beacons.length > 0);

     // Check to see if this region is a voting region
   } else if (Platform.OS !== 'ios' ? (data.identifier === env.votingRegion.identifier) : (data.region.identifier === env.votingRegion.identifier)) {
     console.log('Voting');
     this.votingBeaconsDidRange(data);


     // Starts the next (Tim's Office) only if user is Tim
     if (GlobalFunctions.userIsTim()) {
       if (Platform.OS === 'ios') {
         Beacons.startRangingBeaconsInRegion(env.timsOfficeRegion);
       } else {
         Beacons.startRangingBeaconsInRegion(env.timsOfficeRegion.identifier, env.timsOfficeRegion.uuid);
       }
     } else {
       // Otherwise this is the end of the line
       if (data.beacons.length === 0 && this.locationTextCurrentPriority === 0) {
         Beacons.startRangingBeaconsInRegion(env.labRegion);
         this.startRanging();
       } else {
         this.stopRanging();
       }
     }

     // Check to see if this region is a event checkin
   } else if (Platform.OS !== 'ios' ? (data.identifier === env.checkInRegion.identifier) : (data.region.identifier === env.checkInRegion.identifier)) {
     console.log('Check in');
     // Doing the same thing but for check-in beacons
     BeaconController.performCallbacks(this.checkInListeners, data.beacons.length > 0);

     // Start the next region (Voting events)
     if (Platform.OS !== 'ios') {
       Beacons.startRangingBeaconsInRegion(env.votingRegion.identifier, env.votingRegion.uuid);
     } else {
       Beacons.startRangingBeaconsInRegion(env.votingRegion);
     }

     // Last possible case: it is DALI
   } else {
     console.log('DALI');
     // Keeping track of wheter I'm in DALI or not
     this.inDALI = data.beacons.length > 0;
     this.rangedDALI = true;
     BeaconController.performCallbacks(this.beaconRangeListeners, data.beacons);
     ServerCommunicator.current.enterExitDALI(this.inDALI);
     if (data.beacons.length > 0 && this.locationTextCurrentPriority < inLabPriority) {
       BeaconController.performCallbacks(this.locationInformationListeners, 'In DALI Lab');
       this.locationTextCurrentPriority = inLabPriority;
     } else if (data.beacons.length === 0 && this.locationTextCurrentPriority < outOfLabPriority) {
       BeaconController.performCallbacks(this.locationInformationListeners, 'Not in DALI Lab');
       this.locationTextCurrentPriority = outOfLabPriority;
     }

     this.setUpBackgroundUpdates(this.inDALI);

     // Start the next region (Check-in)
     if (Platform.OS !== 'ios') {
       Beacons.startRangingBeaconsInRegion(env.checkInRegion.identifier, env.checkInRegion.uuid);
     } else {
       Beacons.startRangingBeaconsInRegion(env.checkInRegion);
     }
   }
 }

 setUpBackgroundUpdates(inDALI) {
   StorageController.getServerUpdateInterval().then((interval) => {
     // Cancel the timer when you are done with it
     if (!inDALI) {
       if (interval != null) {
         BackgroundTimer.clearInterval(interval);
         StorageController.saveServerUpdateInterval(null);
       }
     } else {
       if (interval === null) {
         const intervalId = BackgroundTimer.setInterval(() => {
           // this will be executed every 10 minutes
           // even when app is the the background
           console.log('Refreshing the server');
           this.startRanging();
         }, 10 * 60 * 1000); // 10 minutes

         StorageController.saveServerUpdateInterval(intervalId).then(() => {
           // saved
         });
       }
     }
   });
 }

  /**
	This listener will be a function that takes a Boolean value indicating inDALI
	*/
 addEnterExitListener(listener) {
   this.enterExitListeners.push(listener);
 }

  /**
	If the user is Tim, adds the given listener to the listeners
	*/
 addTimsOfficeListener(listener) {
   // Only if it's Tim
   if (GlobalFunctions.userIsTim()) {
     // Again split between iOS and Android
     // Although if I have already set it up I wont do either
     if (Platform.OS === 'ios' && !this.setUpTimsOffice) {
       Beacons.startMonitoringForRegion(env.timsOfficeRegion);
     } else if (!this.setUpTimsOffice) {
       env.timsOfficeRegion.major = 1;
       env.timsOfficeRegion.minor = 1;

       Beacons.startMonitoringForRegion(env.timsOfficeRegion).then(() => {
         console.log('Started monitoring', env.timsOfficeRegion);
       }).catch((error) => {
         console.log(error);
       });
     }

     // Its set up now
     this.setUpTimsOffice = true;

     // Save listener
     this.timsOfficeListeners.push(listener);
   }
 }

  /**
	* Adds the given function to the listeners for checking in
	* 	listener: () => {
	*		//...
	*  }
	*/
 addCheckInListener(listener) {
   this.checkInListeners.push(listener);
 }

  /**
	* Adds the given function to the listeners for beacons
	* 	listener: (beacons) => {
	*		//...
	*  }
	*/
 addBeaconDidRangeListener(listener) {
   this.beaconRangeListeners.push(listener);
 }

  /**
	* Adds the given function to the listeners for beacons
	* 	listener: (inRange) => {
	*		//...
	*  }
	*/
 addVotingRegionListener(listener) {
   this.votingRegionListeners.push(listener);
 }

 addLocationInformationListener(listener) {
   this.locationInformationListeners.push(listener);
 }

  /**
	* Removes the indicated listener from the enter exit listeners
	*  listener: Function
	* Returns:
	*  Bool: (success)
	*/
 removeEnterExitListener(listener) {
   return BeaconController.removeCallback(listener, this.enterExitListeners);
 }

  // Same as previous
 removeBeaconDidRangeListener(listener) {
   return BeaconController.removeCallback(listener, this.enterExitListeners);
 }

  // Same as previous
 removeCheckInListener(listener) {
   return BeaconController.removeCallback(listener, this.checkInListeners);
 }

  // Same as previous
 removeTimsOfficeListener(listener) {
   return BeaconController.removeCallback(listener, this.timsOfficeListeners);
 }

  // Same as previous
 removeVotingRegionListener(listener) {
   return BeaconController.removeCallback(listener, this.votingRegionListeners);
 }

 removeLocationInformationListener(listener) {
   return BeaconController.removeCallback(listener, this.locationInformationListeners);
 }


  // Removes the given callback from the given list of callbacks
  // Takes a callback and a list of callbacks
  // returns Boolean indicating wheter it found one to remove
 static removeCallback(callback, list) {
   // Get te index
   const index = list.indexOf(callback);
   if (index === -1) {
     // Doesn't exist
     return false;
   } else {
     // Does... Remove
     list.splice(index, 1);
     return true;
   }
 }

  // Performs all the callbacks given to it with the remaining arguments in the call
 static performCallbacks(callbacks) {
   // This is my method of getting all the arguments except for the list of callbacks
   const args = Array.prototype.slice.call(arguments, 1);
   callbacks.forEach((callback) => {
     // To use the arguments I have to use the apply method of the function
     callback(...args);
   });
 }
}

export default BeaconController;
