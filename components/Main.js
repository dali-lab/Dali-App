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
let StorageController = require('./StorageController').default;
var ColorPicker = require('./ColorPicker');
import {GoogleSignin} from 'react-native-google-signin';


class Main extends Component {
	constructor() {
		super()

		this.state = {
			selectedColor: null,
			pickerOpen: false
		}

		StorageController.getColor().then((color, error) => {
			if (error) console.log(error);
			this.setState({
				selectedColor: color
			})
		});
	}

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
		const colorPick = <View style={{height: 250}} ><ColorPicker colorSelected={(color) => {
			this.setState({
				selectedColor: color
			});
			StorageController.saveColor(color).then((error) => {
				if (error) console.log(error);
			});
		}}/></View>

		return (
			<View style={styles.container}>
				<View style={{padding: 10, borderRadius: 100, backgroundColor: this.state.selectedColor || "white"}}>
					<Image
					style={{width: 100, height: 100, borderRadius: 50}}
					source={{uri: this.props.user.photo}}/>
				</View>
				<TouchableHighlight
					style={styles.button}
					onPress={this.logout.bind(this)}>
					<Text style={styles.buttonText}>Logout</Text>
				</TouchableHighlight>
				<TouchableHighlight
					style={styles.button}
					onPress={() => {
						this.setState({
							pickerOpen: !this.state.pickerOpen
						});
					}}>
					<Text style={styles.buttonText}>{this.state.pickerOpen ? "Finish Color Picking" : "Choose Color"}</Text>
				</TouchableHighlight>
				{this.state.pickerOpen ? colorPick : null}
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
