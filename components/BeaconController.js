
import Beacons from 'react-native-beacons-manager';
import PushNotification from 'react-native-push-notification';
import {
	DeviceEventEmitter,
	Platform,
	Alert
} from 'react-native';
const StorageController = require('./StorageController').default
import {GoogleSignin} from 'react-native-google-signin';

// Define a region which can be identifier + uuid,
// identifier + uuid + major or identifier + uuid + major + minor
// (minor and major properties are numbers)
var labRegion = {
	identifier: 'DALI lab',
	uuid: 'F2363048-F649-4537-AB7E-4DADB9966544'
};

var checkInRegion = {
	identifier: 'Check In',
	uuid: 'C371F9F9-572D-4D59-956C-5C3DF4BE50B7'
};

var timsOfficeRegion = {
	identifier: 'Tims office',
	uuid: 'BC832F8A-B9B3-4147-ADC7-9C9BEF02E4DC'
};


class BeaconController {
	static current = null;
	static ios = false;
	static inDALI() {
		return BeaconController.current.inDALI;
	}

	constructor(ios) {
		this.authorization = null;
		if (ios) {
			BeaconController.ios = ios
			Beacons.requestAlwaysAuthorization();
			Beacons.requestWhenInUseAuthorization();

			Beacons.getAuthorizationStatus(function(authorization) {
				// authorization is a string which is either "authorizedAlways",
				// "authorizedWhenInUse", "denied", "notDetermined" or "restricted"
				this.authorization = authorization;
				console.log("Got authorization: " + authorization);

				// if (authorization != "authorizedAlways" && authorization != "authorizedWhenInUse") {
				// 	Alert.alert("No authorization!", "In your settings you have not given authorization to access your location. This will cause many features to be unavailable")
				// }
			});
			Beacons.startMonitoringForRegion(labRegion);
			Beacons.startMonitoringForRegion(checkInRegion);
		}else{

			Beacons.detectIBeacons()
			Beacons.detectEstimotes()

			labRegion.major = 1
			labRegion.minor = 1

			checkInRegion.major = 1
			checkInRegion.minor = 1

			Beacons.startMonitoringForRegion(labRegion).then(()=> {
				console.log("Started monitoring", labRegion)
			}).catch((error) => {
				console.log(error)
			});
			Beacons.startMonitoringForRegion(checkInRegion).then(()=> {
				console.log("Started monitoring", checkInRegion)
			}).catch((error) => {
				console.log(error)
			});
		}

		this.inDALI = false;
		this.enterExitListeners = [];
		this.beaconRangeListeners = [];
		this.timsOfficeListeners = [];
		this.checkInListeners = [];
		BeaconController.current = this;

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

	requestPushPermissions() {
		this.setUpNotifications()
	}

	/**
	 * Enable beacon ranging
	 */
	startRanging() {
		this.numRanged = 0
		if (BeaconController.ios) {
			Beacons.startUpdatingLocation();
			Beacons.startRangingBeaconsInRegion(labRegion);
		}else{
			Beacons.startRangingBeaconsInRegion(labRegion.identifier, labRegion.uuid).then(() => {
				console.log("Started ranging")
			}).catch((error) => {
				console.log("Failed to range")
				console.log(error)
				BeaconController.performCallbacks(this.enterExitListeners, false);
			})
		}

		this.rangingListener = DeviceEventEmitter.addListener('beaconsDidRange', this.beaconsDidRange.bind(this));
	}

	/**
	 * Stop ranging
	 */
	stopRanging() {
		console.log("Stopping...");
		if (BeaconController.ios) {
			Beacons.stopUpdatingLocation();
		}
		if (this.rangingListener != null) {
			this.rangingListener.remove();	
		}
		this.rangingListener = null
	}

	didExitRegion(exitRegion) {
		console.log("Exited region");
		console.log(exitRegion);

		if (exitRegion.region == checkInRegion.identifier || exitRegion.identifier == checkInRegion.identifier) {
			// If we have exited the check-in-region, so we don't want to be notified about the lab
			// We will instead deal with the check in listeners
			BeaconController.performCallbacks(this.checkInListeners, false)
			return
		}

		// Check for Tim's office
		if (exitRegion.region == timsOfficeRegion.identifier || exitRegion.identifier == timsOfficeRegion.identifier) {
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

		this.inDALI = false;
		BeaconController.performCallbacks(this.enterExitListeners, this.inDALI);
	}

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

	didEnterRegion(enterRegion) {
		console.log("Entered region");
		console.log(enterRegion);

		// Check for check-in
		if (enterRegion.region == checkInRegion.identifier || enterRegion.identifier == checkInRegion.identifier) {
			BeaconController.performCallbacks(this.checkInListeners, true);
			return
		}

		// Check for Tim's office
		if (enterRegion.region == timsOfficeRegion.identifier || enterRegion.identifier == timsOfficeRegion.identifier) {
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
	 * Called from listener
	 */
	beaconsDidRange(data) {
		if (this.numRanged > 5) {
			this.stopRanging()
			return
		}
		this.numRanged+=1

		console.log("Ranged beacons: ");
		console.log(data);
		this.data = data;

		if (Platform.OS != "ios" ? (data.identifier == timsOfficeRegion.identifier) : (data.region.identifier == timsOfficeRegion.identifier)) {
			console.log("Tims Office");
			// Get tim
			if (StorageController.userIsTim(GoogleSignin.currentUser())) {
				BeaconController.performCallbacks(this.timsOfficeListeners, data.beacons.count > 0);
			}

			this.stopRanging();
		}else if (Platform.OS != "ios" ? (data.identifier == checkInRegion.identifier) : (data.region.identifier == checkInRegion.identifier)) {
			console.log("Check In");
			// Doing the same thing but for check-in beacons
			BeaconController.performCallbacks(this.checkInListeners, data.beacons.count > 0);

			if (StorageController.userIsTim(GoogleSignin.currentUser())) {
				if (Platform.OS == "ios") {
					Beacons.startRangingBeaconsInRegion(timsOfficeRegion);
				}else{
					Beacons.startRangingBeaconsInRegion(timsOfficeRegion.identifier, timsOfficeRegion.uuid);
				}
			}else{
				// this.stopRanging();
			}
		}else{
			console.log("DALI");
			// Keeping track of wheter I'm in DALI or not
			this.inDALI = data.beacons.length > 0;
			BeaconController.performCallbacks(this.beaconRangeListeners, data.beacons);

			if (Platform.OS != "ios") {
				Beacons.startRangingBeaconsInRegion(checkInRegion.identifier, checkInRegion.uuid);
			}else{
				Beacons.startRangingBeaconsInRegion(checkInRegion);
			}
		}
	}

	/**
	 * This listener will be a function that takes a Boolean value indicating inDALI
	 */
	addEnterExitListener(listener) {
		this.enterExitListeners.push(listener);
	}

	addTimsOfficeListener(listener) {

		if (Platform.OS === 'ios') {
			Beacons.startMonitoringForRegion(timsOfficeRegion);
		}else{
			timsOfficeRegion.major = 1
			timsOfficeRegion.minor = 1

			Beacons.startMonitoringForRegion(timsOfficeRegion).then(()=> {
				console.log("Started monitoring", timsOfficeRegion)
			}).catch((error) => {
				console.log(error)
			});
		}

		this.timsOfficeListeners.push(listener);
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
