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
	Dimensions,
	AppState,
	Linking,
	Animated,
	Patform
} from 'react-native';
let ServerCommunicator = require('./ServerCommunicator').default;
let BeaconController = require('./BeaconController').default;
import LinearGradient from 'react-native-linear-gradient';
import {GoogleSignin} from 'react-native-google-signin';
let Settings = require('./Settings');
let PeopleInLab = require('./PeopleInLab');
let StorageController = require('./StorageController').default;

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

let taHoursExpanded = window.height/2 + 70
let taHoursDefault =  window.height/2 - 100
let eventsExpanded = window.height/2 + 50
let eventsDefault = 240
let shrunkSize = 70

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
			peopleInLabVisible: false,
			taHoursSelected: false,
			eventsSelected: false,
			labHours: null,
			inDALI: null,
			inTimsOffice: false,
			appState: AppState.currentState,
			taGrowAnimationValue: new Animated.Value(),
			eventGrowAnimationValue: new Animated.Value()
		}

		this.state.taGrowAnimationValue.setValue(taHoursDefault)
		this.state.eventGrowAnimationValue.setValue(eventsDefault)
	}

	componentDidMount() {
		AppState.addEventListener('change', this._handleAppStateChange.bind(this));

		this.refreshData()
	}

	_handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!')
			this.refreshData()
    }
		this.setState({appState: nextAppState});
  }

	refreshData() {
		ServerCommunicator.current.getTonightsLabHours().then((labHours) => {
			this.setState({
				labHours: labHours,
				officeHoursDataSource: this.state.officeHoursDataSource.cloneWithRows(labHours)
			})

			if (labHours.length) {
				let first = labHours[0];
				setTimeout(() => {
					this.refreshData()
	      }, Math.abs((new Date()) - first.endDate));
			}
		})

		ServerCommunicator.current.getUpcomingEvents().then((events) => {
			this.setState({
				eventsDataSource: this.state.eventsDataSource.cloneWithRows(events)
			})

			if (events.length > 0) {
				let first = events[0];
				setTimeout(() => {
					this.refreshData()
				}, Math.abs((new Date()) - first.endDate));
			}
		}).catch((error) => {
			console.log(error)
		})


		BeaconController.current.addBeaconDidRangeListener((beacons) => {
			this.setState({
				inDALI: BeaconController.current.inDALI
			});
		})
		// BeaconController.current.startRanging()
		BeaconController.current.addEnterExitListener((inDALI) => {
			this.setState({
				inDALI: inDALI
			})
		})

		if (StorageController.userIsTim(GoogleSignin.currentUser())) {
			BeaconController.current.addTimsOfficeListener((enter) => {
				this.setState({
					inTimsOffice: enter
				})
			})
		}
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
			<TouchableHighlight
				underlayColor="rgba(0,0,0,0.1)"
				onPress={this.openEvent.bind(this, event)}>
				<View style={styles.row}>
					<Text style={styles.leftRowText}>{event.summary}</Text>
					<View style={styles.rightRowView}>
						<Text style={styles.rowTitle}>{formatEvent(event.startDate, event.endDate)}</Text>
						<Text style={styles.detailText}>{event.location}</Text>
					</View>
				</View>
			</TouchableHighlight>
		)
	}

	openEvent(event) {
		console.log(event);
		Linking.openURL(event.htmlLink);
	}

	settingsButtonPressed() {
		this.setState({
			settingsVisible: true
		})
	}

	peopleInLabPressed() {
		this.setState({
			peopleInLabVisible: true
		})
	}

	hideModals() {
		this.setState({
			settingsVisible: false,
			peopleInLabVisible: false
		})
	}

	toggleSectionGrow(section) {
		let TAstart = this.state.taHoursSelected ? taHoursExpanded : (this.state.eventsSelected ? shrunkSize : taHoursDefault)
		let TAend = section == "taHoursSelected" ? (this.state.taHoursSelected ? taHoursDefault : taHoursExpanded) : (this.state.eventsSelected ? taHoursDefault : shrunkSize)

		this.setState({
			taHoursSelected: section == "taHoursSelected" && !this.state.taHoursSelected,
			eventsSelected: section == "eventsSelected" && !this.state.eventsSelected,
		})

		Animated.spring(this.state.taGrowAnimationValue, {
			toValue: TAend
		}).start()
	}

  render() {
		return (
			<LinearGradient colors={['#2696a9', 'rgb(146, 201, 210)']} style={styles.container}>
			<Modal
          animationType={"slide"}
          transparent={false}
          visible={this.state.settingsVisible || this.state.peopleInLabVisible}
          onRequestClose={this.hideModals.bind(this)}>
					{this.state.settingsVisible ? <Settings
						user={this.props.user}
						onLogout={this.props.onLogout}
						dismiss={this.hideModals.bind(this)}/> : null}
					{this.state.peopleInLabVisible ? <PeopleInLab dismiss={this.hideModals.bind(this)}/> : null}
				</Modal>
				<Image source={require('./Assets/DALI_whiteLogo.png')} style={styles.daliImage}/>
				<Text style={styles.locationText}>{this.state.inTimsOffice ? "You are in Tim's Office" : (this.state.inDALI ? "You are in DALI now" : (this.state.inDALI != null ? "You are not in DALI now" : "Loading location..."))}</Text>
				<View style={styles.internalView}>
					<Animated.View style={[
						styles.topView,
						// {height: (this.state.taHoursSelected ? taHoursExpanded : (this.state.eventsSelected ? shrunkSize : taHoursDefault))},
						{height: this.state.taGrowAnimationValue}
					]}>
						<View style={styles.separatorThick}/>
						<TouchableHighlight
							underlayColor="rgba(0,0,0,0)"
							onPress={this.toggleSectionGrow.bind(this, 'taHoursSelected')}>
							<Text style={styles.titleText}>{this.state.labHours == null ? "Loading TA office hours..." : (this.state.labHours.length > 0 ? "TA office hours tonight!" : "No TA office hours tonight")}</Text>
						</TouchableHighlight>
						<View style={styles.separatorThin}/>
						<ListView
							enableEmptySections={true}
							style={styles.listView}
							dataSource={this.state.officeHoursDataSource}
							renderRow={this.renderOfficeHoursRow.bind(this)}/>
					</Animated.View>
					<View style={[styles.bottomView, this.state.eventsSelected ? {height: eventsExpanded} : null]}>
						<View style={styles.separatorThick}/>
						<TouchableHighlight
							underlayColor="rgba(0,0,0,0)"
							onPress={this.toggleSectionGrow.bind(this, 'eventsSelected')}>
							<Text style={styles.titleText}>Upcoming Events</Text>
						</TouchableHighlight>
						<View style={styles.separatorThin}/>
						<ListView
							enableEmptySections={true}
							style={styles.listView}
							dataSource={this.state.eventsDataSource}
							renderRow={this.renderEventRow.bind(this)}/>
					</View>
				</View>
				<LinearGradient colors={['rgb(138, 196, 205)', 'rgb(146, 201, 210)']} style={styles.toolbarView}>
					<View style={{flex: 1}}/>
					<TouchableHighlight
						underlayColor="rgba(0,0,0,0)"
						style={styles.settingsButton}
						onPress={this.settingsButtonPressed.bind(this)}>
						<Image source={require('./Assets/whiteGear.png')} style={styles.settingsButtonImage}/>
					</TouchableHighlight>
					<View style={{flex: 1}}/>
					<TouchableHighlight
					underlayColor="rgba(0,0,0,0)"
					style={styles.inTheLabButton}
					onPress={this.peopleInLabPressed.bind(this)}>
						<Image source={require('./Assets/people.png')} style={styles.settingsButtonImage}/>
					</TouchableHighlight>
					<View style={{flex: 1}}/>
				</LinearGradient>
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
		marginTop: 10,
		marginBottom: 15,
	},
	internalView: {
		flex: 1
	},
	topView: {
		height: window.height/2 - 110,
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
		alignItems: 'center',
		height: eventsDefault
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
	},
	settingsButtonImage: {
		width: 30,
		height: 30,
		resizeMode: 'contain'
	},
	toolbarView: {
		width: window.width,
		flexDirection: 'row',
		paddingTop: 15,
		paddingBottom: 15,
	},
	inTheLabButton: {
		alignSelf: 'center',
	},
	daliImage: {
		height: 50,
		marginTop: 40,
		resizeMode: 'contain'
	}
});

module.exports = Main
