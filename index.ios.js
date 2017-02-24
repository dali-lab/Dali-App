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
} from 'react-native';

import codePush from "react-native-code-push";
import {GoogleSignin} from 'react-native-google-signin';
let BeaconController = require('./components/BeaconController').default;
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

var beaconController = new BeaconController();

export default class dali extends Component {
	render() {
		return (
			<Login/>
		);
	}
}

let codePushOptions = { checkFrequency: codePush.CheckFrequency.ON_APP_RESUME };
dali = codePush(codePushOptions)(dali);

AppRegistry.registerComponent('dali', () => dali);
