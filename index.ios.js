/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  DeviceEventEmitter,
  TouchableHighlight
} from 'react-native';
import Beacons from 'react-native-ibeacon';
import codePush from "react-native-code-push";
// import PushNotification from 'react-native-push-notification';

// Define a region which can be identifier + uuid,
// identifier + uuid + major or identifier + uuid + major + minor
// (minor and major properties are numbers)
var region = {
    identifier: 'DALI lab',
    uuid: 'F2363048-F649-4537-AB7E-4DADB9966544'
};

Beacons.requestWhenInUseAuthorization();
Beacons.startMonitoringForRegion(region);

Beacons.startRangingBeaconsInRegion(region);
Beacons.startUpdatingLocation();

// PushNotification.configure({
//   // (optional) Called when Token is generated (iOS and Android)
//     onRegister: function(token) {
//         console.log( 'TOKEN:', token );
//     },

//     // (required) Called when a remote or local notification is opened or received
//     onNotification: function(notification) {
//         console.log( 'NOTIFICATION:', notification );
//     },

//     // IOS ONLY (optional): default: all - Permissions to register.
//     permissions: {
//         alert: true,
//         badge: true,
//         sound: false
//     },

//     // Should the initial notification be popped automatically
//     // default: true
//     popInitialNotification: true,

//     /**
//       * (optional) default: true
//       * - Specified if permissions (ios) and token (android and ios) will requested or not,
//       * - if not, you must call PushNotificationsHandler.requestPermissions() later
//       */
//     requestPermissions: true,
// });

export default class dali extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inDALI: null,
      beacons: null
    }
  }

  componentDidMount() {
    var sub1 = DeviceEventEmitter.addListener('regionDidEnter', 
      (enterRegion) => {
        console.log("Enter region: " + JSON.stringify(region));
        this.setState({
          inDALI: true,
        })

        // PushNotification.localNotification({
        //   title: "Entered DALI",
        //   message: "You just entered the DALI lab!"
        // });

        Beacons.startRangingBeaconsInRegion(region);
    });

    var sub2 = DeviceEventEmitter.addListener('regionDidExit', 
      (exitRegion) => {
        console.log("Exit region: " + JSON.stringify(region));
        this.setState({
          inDALI: false,
        })

        // PushNotification.localNotification({
        //   title: "Exited DALI",
        //   message: "You just exited the DALI lab! :( Sorry to see you go"
        // });

        Beacons.stopUpdatingLocation();
    });

    var sub3 = DeviceEventEmitter.addListener('beaconsDidRange', (data) => {
      this.setState({
        beacons: data.beacons,
      });
    });

    Beacons.getAuthorizationStatus(function(authorization) {
      // authorization is a string which is either "authorizedAlways",
      // "authorizedWhenInUse", "denied", "notDetermined" or "restricted"
      console.log("Authorization: " + authorization);
    });
  }

  update() {
    codePush.sync({
      updateDialog: true,
      installMode: codePush.InstallMode.IMMEDIATE
    });
  }

  render() {
    let inRange = this.state.beacons != null && this.state.beacons.length;
    var beaconNumText = null;
    var detailText = null;

    if (inRange) {
      beaconNumText = <Text style={styles.instructions}>
        In fact, there {this.state.beacons.length > 1 ? "are" : "is"} {this.state.beacons.length} beacon{this.state.beacons.length > 1 ? "s" : ""} nearby
      </Text>
      let beacon = this.state.beacons[0];
      detailText = <Text style={styles.detail}>
        Major: {beacon.major} Minor: {beacon.minor}{"\n"}
        RSSI: {beacon.rssi}{"\n"}
        Proximity: {beacon.proximity}{"\n"}
        Accuracy: {beacon.accuracy}
      </Text>
    }


    return (
      <View style={styles.container}>
        <View style={styles.container}>
          <Text>{this.state.inDALI != null ? (this.state.inDALI ? "In DALI" : "Not in DALI") : "Loading..."}</Text>

          <Text style={styles.welcome}>
            {inRange > 0 ? "There is a beacon nearby!" : "There are no beacons :("}
          </Text>
          {beaconNumText}
          {detailText}
        </View>
        <View style={styles.bottomBar}>
          <TouchableHighlight style={styles.updateButton} onPress={this.update}>
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableHighlight>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  detail: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
    marginTop: 15,
  },
  bottomBar: {
    backgroundColor: '#adadad',
    height: 50,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    alignSelf: "stretch",
    alignItems: "center",
    padding: 15
  },
  updateButton: {
    alignSelf: "stretch",
  },
  updateButtonText: {
    textAlign: "center",
    color: "#0087ff"
  }
});

let codePushOptions = { checkFrequency: codePush.CheckFrequency.ON_APP_RESUME };
dali = codePush(codePushOptions)(dali);


AppRegistry.registerComponent('dali', () => dali);
