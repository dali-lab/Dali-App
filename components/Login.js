'use strict';

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {GoogleSignin, GoogleSigninButton} from 'react-native-google-signin';

class Login extends Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    return (
      <View style={styles.container}>
        <GoogleSigninButton
          style={{width: 212, height: 48, backgroundColor: "white"}}
          size={GoogleSigninButton.Size.Standard}
          color={GoogleSigninButton.Color.Light}
          onPress={this.signIn}/>
      </View>
    )
  }

  signIn() {

  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
		justifyContent: 'center',
    alignItems: "center"
  }
});

module.exports = Login;
