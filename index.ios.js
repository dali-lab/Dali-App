/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import codePush from "react-native-code-push";
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';

export default class dali extends Component {
  render() {
    return (
      <View style={styles.container}>

        <Text style={styles.instructions}>
          THIS IS A TEST! are you going to work pleaseeeee
        </Text>
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

dali = codePush(dali);

AppRegistry.registerComponent('dali', () => dali);
