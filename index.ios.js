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
  DeviceEventEmitter
} from 'react-native';
import Beacons from 'react-native-ibeacon';

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

export default class dali extends Component {
  constructor(props) {
    super(props);
    this.state = {beacons: null}
  }

  componentDidMount() {

    var subscription = DeviceEventEmitter.addListener('beaconsDidRange',
      (data) => {
        this.setState({
          beacons: data.beacons,
        })
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
        <Text style={styles.welcome}>
          {inRange > 0 ? "There is a beacon nearby!" : "There are no beacons :("}
        </Text>
        {beaconNumText}
        {detailText}
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
});

AppRegistry.registerComponent('dali', () => dali);
