/**
 BeaconController.js
 Deals with ALL the location information, and provides listener options for this data

 REALLY IMPORANT FILE

 AUTHOR: John Kotz
 */
import Beacons from 'react-native-beacons-manager';
import PushNotification from 'react-native-push-notification';
import {
	DeviceEventEmitter,
	Platform,
	Alert
} from 'react-native';
import {GoogleSignin} from 'react-native-google-signin';

// My other modules
const StorageController = require('./StorageController').default
const GlobalFunctions = require('./GlobalFunctions').default
let env = require('./Environment');

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
			throw "Cannot create more than one BeaconController!"
			return
		}

		if (Platform.OS == 'ios') {
			// iOS has its own way of doing things...
			// For one, Android doesn't ask for permission from the user
			Beacons.requestWhenInUseAuthorization();

			this.authorization = null;
			Beacons.getAuthorizationStatus(function(authorization) {
				// authorization is a string which is either "authorizedAlways",
				// "authorizedWhenInUse", "denied", "notDetermined" or "restricted"
				this.authorization = authorization;
				console.log("Got authorization: " + authorization);
			});

			// For the other iOS only requires the object { identifier: "Some ID", uuid: "long-string-ofcharacters" }
			Beacons.startMonitoringForRegion(env.labRegion);
			Beacons.startMonitoringForRegion(env.checkInRegion);
		}else{
			// Android needs explicit declaration of type of beacon detected
			Beacons.detectIBeacons()
			Beacons.detectEstimotes()

			// Android needs major and minor values
			env.labRegion.major = 1
			env.labRegion.minor = 1

			env.checkInRegion.major = 1
			env.checkInRegion.minor = 1

			// Android may fail!
			Beacons.startMonitoringForRegion(env.labRegion).then(()=> {
				console.log("Started monitoring", env.labRegion)
			}).catch((error) => {
				console.log(error)
			});
			Beacons.startMonitoringForRegion(env.checkInRegion).then(()=> {
				console.log("Started monitoring", env.checkInRegion)
			}).catch((error) => {
				console.log(error)
			});
		}

		// Store the current thought of where the device is in relation to DALI
		this.inDALI = false;

		// Listeners for the various events I monitor
		this.enterExitListeners = [];
		this.beaconRangeListeners = [];
		this.timsOfficeListeners = [];
		this.checkInListeners = [];

		// To make sure I don't set up Tim's Office region twice
		this.setUpTimsOffice = false

		// Now that setup is complete I can save this controller as the active controller
		BeaconController.current = this;

		// Set up the listeners for the monitored beacons
		this.enterListener = DeviceEventEmitter.addListener('regionDidEnter', this.didEnterRegion.bind(this));
		this.exitListener = DeviceEventEmitter.addListener('regionDidExit', this.didExitRegion.bind(this));
	}

	setUpNotifications() {
		PushNotification.configure({

			// (optional) Called when Token is generated (iOS and Android)
			onRegister: function(token) {
				console.log( 'TOKEN:', token );
			},

			// (required) Called when a remote or local notification is opened or received
			onNotification: function(notification) {
				/*Remote notification in this form:
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
			senderID: "YOUR GCM SENDER ID",

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
		this.numRanged = 0

		// Again Android does things differently
		if (Platform.OS == 'ios') {
			Beacons.startUpdatingLocation();
			Beacons.startRangingBeaconsInRegion(env.labRegion);
		}else{
			Beacons.startRangingBeaconsInRegion(env.labRegion.identifier, env.labRegion.uuid).then(() => {
				console.log("Started ranging")
			}).catch((error) => {
				console.log("Failed to range")
				console.log(error)
				// Failed to range, report not in the lab
				BeaconController.performCallbacks(this.enterExitListeners, false);
			})
		}

		if (this.rangingListener == null) {
			this.rangingListener = DeviceEventEmitter.addListener('beaconsDidRange', this.beaconsDidRange.bind(this));
		}
	}

	/**
	 * Stop ranging
	 */
	stopRanging() {
		console.log("Stopping...");
		if (Platform.OS == 'ios') {
			Beacons.stopUpdatingLocation();
		}

		// So far I have not found a great way to stop ranging beacons, so I just remove the listener
		if (this.rangingListener != null) {
			this.rangingListener.remove();
			this.rangingListener = null;
		}
	}

	/**
	 Called when the device exits a montiored region
	 */
	didExitRegion(exitRegion) {
		console.log("Exited region");
		console.log(exitRegion);

		if (exitRegion.region == env.checkInRegion.identifier || exitRegion.identifier == env.checkInRegion.identifier) {
			// If we have exited the check-in-region, so we don't want to be notified about the lab
			// We will instead deal with the check in listeners
			BeaconController.performCallbacks(this.checkInListeners, false)
			return
		}

		// Check for Tim's office
		if (exitRegion.region == env.timsOfficeRegion.identifier || exitRegion.identifier == env.timsOfficeRegion.identifier) {
			BeaconController.performCallbacks(this.timsOfficeListeners, false);
			return
		}

		// I will only send enter and exit notifications if the user is signed in
		GoogleSignin.currentUserAsync().then((user) => {
			if (user != null) {
				// Plus I have to chek their preferences
				return StorageController.getLabAccessPreference()
			}
		}).then((value) => {
			// Only if they are logged in and they want to receive these notifications...
			if (value) {
				// Send a notification
				PushNotification.localNotification({
					title: "Exited DALI",
					message: "See you next time!"
				});
			}
		});

		// Save and notify
		this.inDALI = false;
		BeaconController.performCallbacks(this.enterExitListeners, this.inDALI);
	}

	/**
	 Presents a notification to the user that they have been checked in
	 Called by the ServerCommunicator when it has successfully checked in the user
	 */
	checkInComplete() {
		StorageController.getCheckinNotifPreference().then((value) => {
			if (value) {
				PushNotification.localNotification({
					title:"Checked In",
					message: "Just checked you into this event. Have fun!"
				});
			}
		})
	}

	/**
	 Handles entering a region.
	 Called by the didEnterRegion listener I set up
	 */
	didEnterRegion(enterRegion) {
		console.log("Entered region");
		console.log(enterRegion);

		// Check for check-in
		if (enterRegion.region == env.checkInRegion.identifier || enterRegion.identifier == env.checkInRegion.identifier) {
			BeaconController.performCallbacks(this.checkInListeners, true);
			return
		}

		// Check for Tim's office
		if (enterRegion.region == env.timsOfficeRegion.identifier || enterRegion.identifier == env.timsOfficeRegion.identifier) {
			BeaconController.performCallbacks(this.timsOfficeListeners, true);
			return
		}

		// Check user
		GoogleSignin.currentUserAsync().then((user) => {
			if (user != null) {
				// Plus I have to check their preferences
				return StorageController.getLabAccessPreference()
			}
		}).then((value) => {
			// If both are valid, we send
			if (value) {
				PushNotification.localNotification({
					title: "Entered DALI",
					message: "Welcome back to DALI lab!"
				});
			}
		});

		this.inDALI = true;
		BeaconController.performCallbacks(this.enterExitListeners, this.inDALI);
	}

	/**
	 Handles beacons that have been ranged.
	 Called by beaconsDidRange listener
	 */
	beaconsDidRange(data) {
		// An attempt to stop the ranging if it gets out of controll
		if (this.numRanged > 5) {
			this.stopRanging()
			return
		}
		this.numRanged+=1


		console.log("Ranged beacons: ");
		console.log(data);

		/*
			Since I cannot actually range multiple regions at the same time,
				I am staggering them, such that when one finishes it will start the next.
			The order of this is:
				- DALI lab
				- Check in
				- Tim's Office (only if user is Tim)

			The order of the if statements is actually the reverse of this,
				but it is the best way to default to DALI Lab region if it is an unhandled region
		*/

		// Check to see if this region is Tim's Office
		if (Platform.OS != "ios" ? (data.identifier == env.timsOfficeRegion.identifier) : (data.region.identifier == env.timsOfficeRegion.identifier)) {
			console.log("Tims Office");
			// Get tim
			if (GlobalFunctions.userIsTim()) {
				BeaconController.performCallbacks(this.timsOfficeListeners, data.beacons.count > 0);
			}
			// Since this is to be the last in the chain
			this.stopRanging();

		// Check to see if this region is a event checkin
		}else if (Platform.OS != "ios" ? (data.identifier == env.checkInRegion.identifier) : (data.region.identifier == env.checkInRegion.identifier)) {
			console.log("Check In");
			// Doing the same thing but for check-in beacons
			BeaconController.performCallbacks(this.checkInListeners, data.beacons.count > 0);

			// Starts the next (Tim's Office) only if user is Tim
			if (GlobalFunctions.userIsTim()) {
				if (Platform.OS == "ios") {
					Beacons.startRangingBeaconsInRegion(env.timsOfficeRegion);
				}else{
					Beacons.startRangingBeaconsInRegion(env.timsOfficeRegion.identifier, env.timsOfficeRegion.uuid);
				}
			}else{
				// Otherwise this is the end of the line
				this.stopRanging();
			}

		// Last possible case: it is DALI
		}else{
			console.log("DALI");
			// Keeping track of wheter I'm in DALI or not
			this.inDALI = data.beacons.length > 0;
			BeaconController.performCallbacks(this.beaconRangeListeners, data.beacons);

			// Start the next region (Check-in)
			if (Platform.OS != "ios") {
				Beacons.startRangingBeaconsInRegion(env.checkInRegion.identifier, env.checkInRegion.uuid);
			}else{
				Beacons.startRangingBeaconsInRegion(env.checkInRegion);
			}
		}
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
			}else if (!this.setUpTimsOffice) {
				env.timsOfficeRegion.major = 1
				env.timsOfficeRegion.minor = 1

				Beacons.startMonitoringForRegion(env.timsOfficeRegion).then(()=> {
					console.log("Started monitoring", env.timsOfficeRegion)
				}).catch((error) => {
					console.log(error)
				});
			}

			// Its set up now
			this.setUpTimsOffice = true

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

	// Removes the given callback from the given list of callbacks
	// Takes a callback and a list of callbacks
	// returns Boolean indicating wheter it found one to remove
	static removeCallback(callback, list) {
		// Get te index
		let index = list.indexOf(callback);
		if (index == -1) {
			// Doesn't exist
			return false;
		}else{
			// Does... Remove
			list.splice(index, 1);
			return true;
		}
	}

	// Performs all the callbacks given to it with the remaining arguments in the call
	static performCallbacks(callbacks) {
		// This is my method of getting all the arguments except for the list of callbacks
		var args = Array.prototype.slice.call(arguments, 1);;
		callbacks.forEach(function(callback) {
			// To use the arguments I have to use the apply method of the function
			callback.apply(null, args);
		});
	}
}

export default BeaconController;
