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
var Beacons = require('react-native-ibeacon');

// Define a region which can be identifier + uuid,
// identifier + uuid + major or identifier + uuid + major + minor
// (minor and major properties are numbers)
var region = {
    identifier: 'RadBeacon Dots',
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

    if (inRange) {
      beaconNumText = <Text style={styles.instructions}>
        In fact, there are {this.state.beacons.length} beacons nearby
      </Text>
    }

    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          {inRange > 0 ? "There is a beacon nearby!" : "There are no beacons :("}
        </Text>
        {beaconNumText}
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
});

AppRegistry.registerComponent('dali', () => dali);
