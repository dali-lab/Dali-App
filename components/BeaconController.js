
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
		Beacons.requestWhenInUseAuthorization();
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
		});

		this.enterListener = DeviceEventEmitter.addListener('regionDidEnter', this.didEnterRegion);
		this.exitListener = DeviceEventEmitter.addListener('regionDidExit', this.didExitRegion);
	}

	/**
	 * Enable beacon ranging
	 */
	startRanging() {
		Beacons.startMonitoringForRegion(labRegion);
		Beacons.startUpdatingLocation();

		this.rangingListener = DeviceEventEmitter.addListener('beaconsDidRange', this.beaconsDidRange);
	}

	/**
	 * Stop ranging
	 */
	stopRanging() {
		Beacons.stopUpdatingLocation();
	}

	didExitRegion(exitRegion) {
		if (exitRegion.identifier == checkInRegion.identifier) {
			return
		}

		this.inRange = false
		Beacons.stopUpdatingLocation();
		didUpdateLocation();
	}

	didEnterRegion(enterRegion) {
		if (enterRegion.identifier == checkInRegion.identifier) {
			BeaconController.performCallbacks(this.checkInListeners);
			return
		}

		this.inRange = true

		Beacons.startRangingBeaconsInRegion(labRegion);
		if (this.rangingListener == null) {
			this.rangingListener = DeviceEventEmitter.addListener('beaconsDidRange', this.beaconsDidRange);
		}
		didUpdateLocation();
	}

	beaconsDidRange(data) {
		this.data = data;
		this.beacons = [];

		data.beacons.filter((beacon) => {
			return beacon.uuid == labRegion.uuid;
		});

		BeaconController.performCallbacks(this.beaconRangeListeners, data.beacons);
		didUpdateLocation();
	}

	didUpdateLocation() {
		var inDALI = this.inDALI();
		var previousValue = this.previousInDALI
		if (inDALI != previousValue) {
			// Thus the value has changed!
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
		for (callback in callbacks) {
			callback(arguments.splice(1,1));
		}
	}
}

export default BeaconController;
