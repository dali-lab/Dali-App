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
let BeaconController = require('./BeaconController');
import {GoogleSignin} from 'react-native-google-signin';


class Main extends Component {
	propTypes: {
		onLogout: ReactNative.PropTypes.func,
	}

	logout() {
		GoogleSignin.signOut()
		.then(() => {
		  this.props.onLogout();
		})
		.catch((err) => {

		});
	}

  render() {
		return (
			<View style={styles.container}>
				<TouchableHighlight
					style={styles.button}
					onPress={this.logout.bind(this)}>
					<Text style={styles.buttonText}>Logout</Text>
				</TouchableHighlight>
			</View>
		)
	}
}


const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "white",
		alignItems: 'center',
		justifyContent: 'center'
	},
	button: {

	},
	buttonText: {
		color: "#0087ff"
	}
});

module.exports = Main
