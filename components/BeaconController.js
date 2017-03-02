
import Beacons from 'react-native-beacons-manager';
import {
	DeviceEventEmitter,
} from 'react-native';

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

class BeaconController {
	static current = null;
	static inDALI() {
		return BeaconController.current.inDALI();
	}

	inDALI() {
		if (!this.inRange) {
			return false;
		}

		// If we are in range, we will do more interesting checking of the beacon data
		// For now we shall assume that we are in DALI
		return true;
	}

	constructor() {
		Beacons.requestAlwaysAuthorization();
		Beacons.startMonitoringForRegion(labRegion);
		Beacons.startMonitoringForRegion(checkInRegion);
		this.authorization = null;
		this.inRange = false
		this.enterExitListeners = [];
		this.beaconRangeListeners = [];
		this.checkInListeners = [];
		BeaconController.current = this;

		Beacons.getAuthorizationStatus(function(authorization) {
			// authorization is a string which is either "authorizedAlways",
			// "authorizedWhenInUse", "denied", "notDetermined" or "restricted"
			this.authorization = authorization;
			console.log("Got authorization: " + authorization);
		});

		this.enterListener = DeviceEventEmitter.addListener('regionDidEnter', this.didEnterRegion.bind(this));
		this.exitListener = DeviceEventEmitter.addListener('regionDidExit', this.didExitRegion.bind(this));
	}

	/**
	 * Enable beacon ranging
	 */
	startRanging() {
		Beacons.startMonitoringForRegion(labRegion);
		Beacons.startUpdatingLocation();

		this.rangingListener = DeviceEventEmitter.addListener('beaconsDidRange', this.beaconsDidRange.bind(this));
	}

	/**
	 * Stop ranging
	 */
	stopRanging() {
		Beacons.stopUpdatingLocation();
	}

	didExitRegion(exitRegion) {
		console.log("Exited region");
		console.log(exitRegion);
		if (exitRegion.region == checkInRegion.identifier) {
			BeaconController.performCallbacks(this.checkInListeners, false)
			return
		}

		this.inRange = false
		this.didUpdateLocation();
	}

	didEnterRegion(enterRegion) {
		console.log("Entered region");
		console.log(enterRegion);
		if (enterRegion.region == checkInRegion.identifier) {
			BeaconController.performCallbacks(this.checkInListeners, true);
			return
		}

		this.inRange = true
		this.didUpdateLocation();
	}

	beaconsDidRange(data) {
		console.log("Ranged beacons: " + data);
		this.data = data;
		this.beacons = [];

		data.beacons.filter((beacon) => {
			return beacon.uuid == labRegion.uuid;
		});

		BeaconController.performCallbacks(this.beaconRangeListeners, data.beacons);
		this.didUpdateLocation();
	}

	didUpdateLocation() {
		var inDALI = this.inDALI();
		var previousValue = this.previousInDALI;
		if (inDALI != previousValue) {
			// Thus the value has changed!
			console.log("Enter/exit DALI");
			BeaconController.performCallbacks(this.enterExitListeners, inDALI);
		}
		this.previousInDALI = inDALI
	}

	/**
	 * This listener will be a function that takes a Boolean value indicating inDALI
	 */
	addEnterExitListener(listener) {
		this.enterExitListeners.push(listener);
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
	addBeaconDidRagneListener(listener) {
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

	removeBeaconDidRangeListener(listener) {
		return BeaconController.removeCallback(listener, this.enterExitListeners);
	}

	removeCheckInListener(listener) {
		return BeaconController.removeCallback(listener, this.checkInListeners);
	}

	static removeCallback(callback, list) {
		let index = list.indexOf(callback);
		if (index == -1) {
			return false;
		}else{
			list.splice(index, 1);
			return true;
		}
	}

	static performCallbacks(callbacks) {
		console.log(arguments);
		var args = Array.prototype.slice.call(arguments, 1);;
		callbacks.forEach(function(callback) {
				callback(args);
		});
	}
}

export default BeaconController;
