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
	Modal,
	Dimensions
} from 'react-native';
let ServerCommunicator = require('./ServerCommunicator').default;
let BeaconController = require('./BeaconController').default;
import LinearGradient from 'react-native-linear-gradient';
import {GoogleSignin} from 'react-native-google-signin';
let Settings = require('./Settings');

var window = Dimensions.get('window')


function formatEvent(start, end) {
	let weekDays = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat']

	function formatTime(time) {
		var hours = time.getHours()

		if (hours > 12) {
			hours -= 12
		}

		return hours.toString() + (time.getMinutes() == 0 ? '' : ':' + time.getMinutes().toString())
	}

	return weekDays[start.getDay()] + ' ' + formatTime(start) + ' - ' + formatTime(end) + ' ' + ((start.getHours() + 1) >= 12 ? "PM" : "AM")
}

class Main extends Component {
	propTypes: {
		onLogout: ReactNative.PropTypes.func,
		user: ReactNative.PropTypes.object.isRequired,
	}

	constructor() {
		super()

		this.state = {
			officeHoursDataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
			eventsDataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
			settingsVisible: false,
			labHours: null,
			inDALI: null,
		}

		ServerCommunicator.current.getLabHours().then((labHours) => {
			this.setState({
				labHours: labHours,
				officeHoursDataSource: this.state.officeHoursDataSource.cloneWithRows(labHours)
			})
		})

		ServerCommunicator.current.getUpcomingEvents().then((events) => {
			this.setState({
				eventsDataSource: this.state.eventsDataSource.cloneWithRows(events)
			})
		}).catch((error) => {
			console.log(error)
		})

		BeaconController.current.startRanging()
		BeaconController.current.addEnterExitListener((inDALI) => {
			this.setState({
				inDALI: inDALI
			});
		})
	}

	logout() {
		GoogleSignin.signOut()
		.then(() => {
		  this.props.onLogout();
		})
		.catch((err) => {
			console.log(err);
		});
	}


	renderOfficeHoursRow(hour) {
		return (
			<View style={styles.row}>
				<Text style={[styles.leftRowText, {width: 60}]}>{hour.startDate.getHours() - 12} - {hour.endDate.getHours() - 12}pm</Text>
				<View style={styles.rightRowView}>
					<Text style={styles.rowTitle}>{hour.name}</Text>
					<Text style={styles.detailText}>{hour.skills}</Text>
				</View>
			</View>
		)
	}

	renderEventRow(event) {
		return (
			<View style={styles.row}>
				<Text style={styles.leftRowText}>{event.summary}</Text>
				<View style={styles.rightRowView}>
					<Text style={styles.rowTitle}>{formatEvent(event.startDate, event.endDate)}</Text>
					<Text style={styles.detailText}>{event.location}</Text>
				</View>
			</View>
		)
	}

	settingsButtonPressed() {
		this.setState({
			settingsVisible: true
		})
	}

	hideSettings() {
		this.setState({
			settingsVisible: false
		})
	}

  render() {
		return (
			<LinearGradient colors={['#2696a9', 'rgb(146, 201, 210)']} style={styles.container}>
			<Modal
          animationType={"slide"}
          transparent={false}
          visible={this.state.settingsVisible}
          onRequestClose={() => {
						this.setState({
							settingsVisible: false
						})
					}}>
					<Settings
						user={this.props.user}
						onLogout={this.props.onLogout}
						dismiss={this.hideSettings.bind(this)}/>
				</Modal>
				<Image source={require('./Assets/DALI_whiteLogo.png')} style={styles.daliImage}/>
				<Text style={styles.locationText}>{this.state.inDALI ? "You are in DALI now" : (this.state.inDALI != null ? "You are not in DALI now" : "Loading location...")}</Text>
				<View style={styles.internalView}>
					<View style={[styles.topView, {height: (this.state.labHours != null && this.state.labHours.length > 0 ? window.height/2 - 130 : window.height/2 - 170)}]}>
						<View style={styles.separatorThick}/>
						<Text style={styles.titleText}>{this.state.labHours == null ? "Loading TA office hours..." : (this.state.labHours.length > 0 ? "TA office hours tonight!" : "No TA office hours tonight")}</Text>
						<View style={styles.separatorThin}/>
						<ListView
							enableEmptySections={true}
							style={styles.listView}
							dataSource={this.state.officeHoursDataSource}
							renderRow={this.renderOfficeHoursRow.bind(this)}/>
					</View>
					<View style={styles.bottomView}>
						<View style={styles.separatorThick}/>
						<Text style={styles.titleText}>Upcoming Events</Text>
						<View style={styles.separatorThin}/>
						<ListView
							enableEmptySections={true}
							style={styles.listView}
							dataSource={this.state.eventsDataSource}
							renderRow={this.renderEventRow.bind(this)}/>
					</View>
				</View>
				<TouchableHighlight
					underlayColor="rgba(0,0,0,0)"
					style={styles.settingsButton}
					onPress={this.settingsButtonPressed.bind(this)}>
					<Image source={require('./Assets/whiteGear.png')} style={styles.settingsButtonImage}/>
				</TouchableHighlight>
			</LinearGradient>
		)
	}
}


const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	separatorThick: {
		backgroundColor: 'white',
		height: 2,
		width: window.width - 83
	},
	separatorThin: {
		backgroundColor: 'white',
		height: 0.3,
		width: window.width - 83
	},
	locationText: {
		backgroundColor: 'rgba(0,0,0,0)',
		color: 'white',
		fontFamily: 'Avenir Next',
		fontSize: 16,
		marginTop: 20,
		marginBottom: 15,
	},
	internalView: {
		flex: 1
	},
	topView: {
		height: window.height/2 - 150,
		alignItems: 'center'
	},
	titleText: {
		color: 'white',
		fontFamily: 'Avenir Next',
		fontWeight: '600',
		fontSize: 19,
		marginTop: 14,
		marginBottom: 14,
		backgroundColor: 'rgba(0,0,0,0)'
	},
	bottomView: {
		alignItems: 'center'
	},
	listView: {
		flex: 1,
	},
	leftRowText: {
		color: 'white',
		fontFamily: 'Avenir Next',
		fontWeight: '700',
		fontSize: 14,
		marginRight: 20,
		width: 110
	},
	rightRowView: {
		flex: 1
	},
	rowTitle: {
		color: 'white',
		fontFamily: 'Avenir Next',
		fontWeight: '600',
		fontSize: 15
	},
	detailText: {
		color: 'white',
		fontFamily: 'Avenir Next',
		fontStyle: 'italic',
		fontSize: 11,
		fontWeight: '500'
	},
	row: {
		paddingTop: 10,
		backgroundColor: 'rgba(0, 0, 0, 0)',
		width: window.width - 83,
		marginBottom: 5,
		marginTop: 5,
		flexDirection: 'row'
	},
	settingsButton: {
		marginBottom: 25,
	},
	settingsButtonImage: {
		width: 30,
		height: 30,
		resizeMode: 'contain'
	},
	daliImage: {
		height: 50,
		marginTop: 60,
		resizeMode: 'contain'
	}
});

module.exports = Main
