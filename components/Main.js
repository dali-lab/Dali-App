import React, { Component } from 'react';
import {
	AppRegistry,
	StyleSheet,
	Text,
	View,
	DeviceEventEmitter,
	TouchableHighlight,
	ListView,
	Image,
} from 'react-native';
let BeaconController = require('./BeaconController');
let ServerCommunicator = require('./ServerCommunicator').default;
import {GoogleSignin} from 'react-native-google-signin';


class Main extends Component {
	propTypes: {
		onLogout: ReactNative.PropTypes.func,
		user: ReactNative.PropTypes.object.isRequired,
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
				<Image
				style={{width: 100, height: 100}}
				source={{uri: this.props.user.photo}}/>
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
	},
	checkIn: {
		marginTop: 20,
	}
});

module.exports = Main
