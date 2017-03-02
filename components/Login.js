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
  propTypes: {
		onLogin: ReactNative.PropTypes.func,
  }

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={styles.container}>
        <GoogleSigninButton
          style={{width: 312, height: 48, backgroundColor: "white"}}
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={this.signIn.bind(this)}/>
      </View>
    )
  }

  signIn() {
    GoogleSignin.signIn()
    .then((user) => {
  		this.props.onLogin(user);
    })
    .catch((err) => {
    })
    .done();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
		justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "white"
  }
});

module.exports = Login;
