/**
* DALI Lab App - IN REACT-NATIVE!
* https://github.com/facebook/react-native
*
* AUTHOR: John Kotz
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
import {GoogleSignin} from 'react-native-google-signin';

// My packages
let BeaconController = require('./components/BeaconController').default;
let ServerCommunicator = require('./components/ServerCommunicator').default;
let env = require('./components/Environment');
let Main = require('./components/Main');
let Login = require('./components/Login');

// GoogleSignin requires configuration...
GoogleSignin.configure(env.googleConfig);
let beaconController = new BeaconController();
let serverCommunicator = new ServerCommunicator(beaconController);

// Will pull the current user from memory.
// I'm doing this early so the user doesn't have to wait for a second for it to take effect
var startingUser = null;
GoogleSignin.currentUserAsync().then((user) => {
	startingUser = user;
	serverCommunicator.loggedIn(user);
	if (dali.current) {
		dali.current.setState({
			user: user
		})
	}
})

// The entrance Component for the application. This will be rendered first
export default class dali extends Component {
	static current = null;

	constructor(props, context) {
		super(props, context);

		// Start with the startingUser
		this.state = {
			user: null,
			skippedLogin: false
		};
		dali.current = this
	}

	componentWillMount() {
		// I may have already successfully retrieved the user!
		if (startingUser == null && this.state.user == null) {
			// I guess not
			// So load it...
			GoogleSignin.currentUserAsync().then((user) => {
				if (user) {
					// Updating my controllers
					serverCommunicator.loggedIn(user)
				};

				// Now move on to the main screen
				this.setState({
					user: user
				});
			}).done();
		}else if (startingUser != null) {
			// I had a preloaded user!
			this.setState({
				user: startingUser
			})
		}
		// Otherwise I dont care. I already have a user
	}

	/**
	Updates the application towards using the Main screen rather than Login
	Called by the Login module when logging in is complete
	*/
	onLogin(user) {
		serverCommunicator.loggedIn(user);
		this.setState({
			user: user,
		});
	}

	/**
	Logs out the user and updates the application towards using the Login screen
	Called by the Settings component, although it is passed through Main first.
	*/
	onLogout() {
		GoogleSignin.signOut().then(() => {
			serverCommunicator.user = null;
			this.setState({
				user: null,
				skippedLogin: false
			});
		})
	}

	onSkipLogin() {
		this.setState({
			skippedLogin: true,
		})
	}

	render() {
		// Determines which view to use as the internal view
		var internalView = null;
		if (this.state.user == null && !this.state.skippedLogin){
			internalView = <Login onLogin={this.onLogin.bind(this)} onSkipLogin={this.onSkipLogin.bind(this)}/>;
		}else{
			internalView = <Main onLogout={this.onLogout.bind(this)} user={this.state.user}/>;
		}

		// Render with the internal view,
		//	forcing some styles and status bar configurations to make it look good
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

// Start the app with the given class
AppRegistry.registerComponent('dali', () => dali);
