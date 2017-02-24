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
  constructor(props) {
    super();
    super.props(props);
  }

  render() {
    return (
      <GoogleSigninButton
        style={{width: 48, height: 48}}
        size={GoogleSigninButton.Size.Standard}
        color={GoogleSigninButton.Color.Dark}
        onPress={this.signIn}/>
    )
  }

  signIn() {

  }
}

module.exports = Login;
