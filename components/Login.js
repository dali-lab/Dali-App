'use strict';

import React, { Component } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableHighlight
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
          <LinearGradient colors={['#2f97aa', '#95c9d2', '#FFFFFF']} style={styles.container}>
            <View>
              <View style={styles.innerContainer}>
                <Image source={require('./Assets/DALI_whiteLogo.png')} style={styles.daliImage}/>
                <TouchableHighlight
                  style={[styles.buttonShadow, styles.button]}
                  onPress={this.signIn.bind(this)}>
                  <View style={styles.button}>
                    <Image source={require('./Assets/googleG.png')} style={styles.googleG}/>
                    <Text style={styles.googleText}>SIGN IN WITH GOOGLE</Text>
                  </View>
                </TouchableHighlight>
              <View style={{height: 70}}/>
              </View>
            </View>
          </LinearGradient>
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
    flexDirection: 'row'
  },
  innerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  googleG: {
    width: 26,
    resizeMode: 'contain',
    height: 26
  },
  googleText: {
    backgroundColor: 'rgba(0,0,0,0)',
    color: "rgba(174, 174, 174, 1.0)",
    fontFamily: "Avenir Next",
    fontWeight: "600",
    marginLeft: 10
  },
  button: {
    width: 235,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    flexDirection: 'row',
  },
  buttonShadow: {
    shadowOffset: {width: 0, height: 2},
    shadowColor: "gray",
    shadowOpacity: 0.4
  },
  daliImage: {
    width: 260,
    resizeMode: 'contain',
    height: 100,
    marginBottom: 30
  }
});

module.exports = Login;
