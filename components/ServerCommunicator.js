let BeaconController = require('./components/BeaconController').default;

/**
 * This class will control all server comunication.
 * It will also take a beaconController and set up listeners for check in and enterExit,
 *   and when called will deal with these server communicatons
 */
class ServerCommunicator {
  constructor(beaconController) {
    this.beaconController = beaconController;
    this.beaconController.addCheckInListener(this.checkIn);
    this.beaconController.addEnterExitListener(this.enterExitDALI);
  }

  constructor() {
    
  }

  checkIn=() => {
    // TODO: send POST to server for check in
  }

  enterExitDALI=() => {
    // TODO: send POST to server for enter and exit DALI
  }
}
