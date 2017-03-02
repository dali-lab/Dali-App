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
let ServerCommunicator = require('./components/ServerCommunicator').default;
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
      iosClientId: "668475965898-ro6r9f7r2jbvkevlj618nkmjb2nv0jut.apps.googleusercontent.com"
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
				<View style={{flex:1, flexDirection: 'row'}}>
        {internalView}
				</View>
        <View style={styles.bottomBar}>
          <TouchableHighlight style={styles.updateButton} onPress={this.update}>
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableHighlight>
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
