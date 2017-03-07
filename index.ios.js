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
	TouchableHighlight,
	ListView,
	StatusBar
} from 'react-native';

import codePush from "react-native-code-push";
import {GoogleSignin} from 'react-native-google-signin';
let BeaconController = require('./components/BeaconController').default;
let ServerCommunicator = require('./components/ServerCommunicator').default;
let env = require('./components/Environment');
var Main = require('./components/Main');
var Login = require('./components/Login');

// import PushNotification from 'react-native-push-notification';
// PushNotification.configure({
//	 // (optional) Called when Token is generated (iOS and Android)
//		 onRegister: function(token) {
//				 console.log( 'TOKEN:', token );
//		 },

//		 // (required) Called when a remote or local notification is opened or received
//		 onNotification: function(notification) {
//				 console.log( 'NOTIFICATION:', notification );
//		 },

//		 // IOS ONLY (optional): default: all - Permissions to register.
//		 permissions: {
//				 alert: true,
//				 badge: true,
//				 sound: false
//		 },

//		 // Should the initial notification be popped automatically
//		 // default: true
//		 popInitialNotification: true,

//		 /**
//			 * (optional) default: true
//			 * - Specified if permissions (ios) and token (android and ios) will requested or not,
//			 * - if not, you must call PushNotificationsHandler.requestPermissions() later
//			 */
//		 requestPermissions: true,
// });

let beaconController = new BeaconController();
let serverCommunicator = new ServerCommunicator(beaconController);

export default class dali extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      user: null,
      configured: false
    };
  }

  componentWillMount() {
    GoogleSignin.configure({
      iosClientId: env.googleIOSClient
    }).then(() => {
      return GoogleSignin.currentUserAsync()
    }).then((user) => {
			serverCommunicator.loggedIn(user);
      this.setState({
        user: user,
        configured: true
      });
    }).done();
  }

  update() {
    codePush.sync({
      updateDialog: true,
      installMode: codePush.InstallMode.IMMEDIATE
    });
  }

	onLogin(user) {
		console.log(user);
		serverCommunicator.loggedIn(user);
		this.setState({
			user: user,
		});
	}

	onLogout() {
		serverCommunicator.user = null;
		this.setState({
			user: null,
		});
	}

	render() {
    var internalView = null;
    if (!this.state.configured) {
      internalView = <View/>;
    }else if (this.state.user == null){
      internalView = <Login onLogin={this.onLogin.bind(this)}/>;
    }else{
      internalView = <Main onLogout={this.onLogout.bind(this)} user={this.state.user}/>;
    }

    return (
      <View style={styles.container}>
				<StatusBar
					barStyle="light-content"/>
				<View style={{flex:1, flexDirection: 'row'}}>
        {internalView}
				</View>
      </View>
    )
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	}
});

let codePushOptions = { checkFrequency: codePush.CheckFrequency.ON_APP_RESUME };
dali = codePush(codePushOptions)(dali);

AppRegistry.registerComponent('dali', () => dali);
