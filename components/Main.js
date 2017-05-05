/**
* Main.js
* Presents the main interface for the DALI Lab app.
* Included in this view is:
* 	- ListView of TA Office Hours
* 	- ListView of Upcoming events
*
* AUTHOR: John Kotz
* Copyright (c) 2017 DALI Lab All Rights Reserved.
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
	Image,
	Modal,
	Dimensions,
	AppState,
	Linking,
	Animated,
	Platform,
	Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {GoogleSignin} from 'react-native-google-signin';

// My Components and classes
let ServerCommunicator = require('./ServerCommunicator').default;
let BeaconController = require('./BeaconController').default;
let Settings = require('./Settings');
let PeopleInLab = require('./PeopleInLab');
let EventVote = require('./EventVote');
let StorageController = require('./StorageController').default;
let GlobalFunctions = require('./GlobalFunctions').default;


var window = Dimensions.get('window')

/**
Formats the given events into a simple start - end format
eg. Sun 12 - 1:30 PM

PARAMETERS:
- start: Start date
- end: End date

RETURNS: String
*/
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

// A bunch of constants
// TODO: Refactor into better practice format
const taHoursExpanded = window.height/2 + 70
const officeHoursDefault =  window.height/2 - 100
const eventsExpanded = window.height/2 + 50
const eventsDefault = 240
const shrunkSize = 70

/**
Controlls the the interface for the Main component

PROPS:
- onLogout: Function to call to logout
- user: Object defining the user
*/
class Main extends Component {
	propTypes: {
		onLogout: ReactNative.PropTypes.func,
		user: ReactNative.PropTypes.object.isRequired,
	}

	constructor() {
		super()

		// All very important and not at all understandable:
		this.state = {
			// The data source for the office hours list view
			officeHoursDataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
			// The data source for the events list view
			eventsDataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
			// Indicates whether the Settings component is currently presented over the Main
			settingsVisible: false,
			// Indicates whether the PeopleInLab component is currently presented over the Main
			peopleInLabVisible: false,
			// Indicates whether the office hours list view is currently expanded (Read more: toggleSectionGrow)
			officeHoursSelected: false,
			// Indicates whether the events list view is currently expanded (Read more: toggleSectionGrow)
			eventsSelected: false,
			// Holds the data I will get about the office hours
			officeHours: null,
			locationText: "Loading location...",
			inVotingEvent: false || __DEV__,
			votingVisibile: false,
			// The current state of the application (background or foreground)
			// Will come in handy when reloading data on re-entry to the app
			appState: AppState.currentState,
			// Animated values defining the height of the office hours list view (for animating)
			// (Read more: toggleSectionGrow)
			officeHoursAnimationValue: new Animated.Value()
		}

		// Initialize the value of the office hours list to its default
		this.state.officeHoursAnimationValue.setValue(officeHoursDefault)
	}

	componentDidMount() {
		// Sets up a listener that will be triggered when the the app switches between background and foreground (or vise versa)
		AppState.addEventListener('change', this._handleAppStateChange.bind(this));

		// Get the data to be shown
		this.refreshData()
	}

	_handleAppStateChange = (nextAppState) => {
		// Refresh data if the app is coming into the foreground
		if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
			this.refreshData()
		}
		this.setState({appState: nextAppState});
	}

	/**
	Refreshes the data that is to be presented.
	This includes:
	- Office hours
	- Upcoming events
	- Current location (ie. in lab or not)
	*/
	refreshData() {
		// Retrieve office hours
		if (this.props.user != null) {
			ServerCommunicator.current.getTonightsLabHours().then((officeHours) => {
				this.setState({
					officeHours: officeHours,
					// In order to update the list view I tell to to clone the previous dataSource with the new data
					// It does this, and notices how the old and new data are different, updating the list view accordingly
					officeHoursDataSource: this.state.officeHoursDataSource.cloneWithRows(officeHours)
				});

				if (officeHours.length > 0) {
					// In order to remove office hours from the list as soon as they end, I am setting a timer...
					let first = officeHours[0];
					setTimeout(() => {
						this.refreshData();
					}, Math.abs((new Date()) - first.endDate));
					// ... for the number of milliseconds between now and the end of the most proximous office hour
				}
			}).catch((error) => {
				console.log(error);
			});
		}

		ServerCommunicator.current.getUpcomingEvents().then((events) => {
			var i = 0;
			var foundWeek = false;
			var foundToday = false;
			while (i < events.length) {
				let event = events[i];
				if (event.today && !foundToday) {
					events.splice(i, 0, "TODAY SEPERATOR")
					i++;
					foundToday = true
				}else if (!foundWeek && !event.nextWeek) {
					events.splice(i, 0, "THIS WEEK SEPERATOR");
					i++;
					foundWeek = true;
				}else if (event.nextWeek) {
					events.splice(i, 0, "NEXT WEEK SEPERATOR");
					break;
				}
				i++;
			}

			this.setState({
				// Same as above, but with the events
				eventsDataSource: this.state.eventsDataSource.cloneWithRows(events)
			})

			if (events.length > 0) {
				// Again, same as before:
				// Auto refresh when an event ends
				var i = 0;
				var first = events[0];
				while (i < events.length && first.endDate == undefined) {
					first = events[++i];
				}
				if (first.today) {
					setTimeout(() => {
						this.refreshData();
					}, Math.abs((new Date()) - first.endDate));
				}
			}
		}).catch((error) => {
			console.log(error);
		});

		BeaconController.current.addLocationInformationListener((locationText) => {
			this.setState({
				locationText: locationText
			});
		});

		BeaconController.current.addVotingRegionListener((enter) => {
			this.setState({
				inVotingEvent: enter
			});
		});
	}

	/**
	Logout and notify the index.__.js to switch to Login
	*/
	logout() {
		if (this.props.user == null) {
			this.props.onLogout();
		}

		GoogleSignin.signOut()
		.then(() => {
			this.props.onLogout();
		})
		.catch((err) => {
			console.log(err);
		});
	}

	/// Renders a row for a office hour and returns it
	renderOfficeHoursRow(hour) {
		return (
			<View style={styles.row}>
			<Text style={[styles.leftRowText, {width: 60}]}>{hour.startDate.getHours() - 12} - {hour.endDate.getHours() - 12} pm</Text>
			<View style={styles.rightRowView}>
			<Text style={styles.rowTitle}>{hour.name}</Text>
			<Text style={styles.detailText}>{hour.skills}</Text>
			</View>
			</View>
		)
	}

	/// Renders a row for an event and returns it
	renderEventRow(event) {
		if (event == "TODAY SEPERATOR") {
			return (
				<View style={styles.weekSeperator}>
				<View style={styles.weekSeperatorLine}/>
				<Text style={styles.weekSeperatorText}>Today</Text>
				<View style={styles.weekSeperatorLine}/>
				</View>
			)
		}else if (event == "THIS WEEK SEPERATOR") {
			return (
				<View style={styles.weekSeperator}>
				<View style={styles.weekSeperatorLine}/>
				<Text style={styles.weekSeperatorText}>This Week</Text>
				<View style={styles.weekSeperatorLine}/>
				</View>
			)
		}else if (event == "NEXT WEEK SEPERATOR") {
			return (
				<View style={styles.weekSeperator}>
				<View style={styles.weekSeperatorLine}/>
				<Text style={styles.weekSeperatorText}>Next Week</Text>
				<View style={styles.weekSeperatorLine}/>
				</View>
			)
		}

		// It is touchable so the user can click it an open the event in a web-browser
		// underlayColor="rgba(0,0,0,0.1)" makes there be a slightly opaque overlay to be placed on the row when pressed
		return (
			<TouchableHighlight
			underlayColor="rgba(0,0,0,0.1)"
			onPress={this.openEvent.bind(this, event)}>
			<View style={styles.row}>
			<Text style={styles.leftRowText}>{event.summary}</Text>
			<View style={styles.rightRowView}>
			<Text style={styles.rowTitle}>{formatEvent(event.startDate, event.endDate)}</Text>
			<Text style={styles.detailText}>{event.location == "" ? event.description : event.location}</Text>
			</View>
			</View>
			</TouchableHighlight>
		)
	}

	/// Opens an event in a web-browser
	openEvent(event) {
		console.log(event);
		Linking.openURL(event.htmlLink);
	}

	/// Shows the Settings modal
	settingsButtonPressed() {
		this.setState({
			settingsVisible: true
		});
	}

	/// Shows the PeopleInLab modal
	peopleInLabPressed() {
		this.setState({
			peopleInLabVisible: true
		});
	}

	votingButtonPressed() {
		if (!BeaconController.current.inVotingEvent && !__DEV__) {
			Alert.alert("You are not at any event",
			"No voting event beacon was found nearby. The beacons use Bluetooth, so this may be because bluetooth is off. You might also not allow the app to access location, which is needed",
			[
				{text: 'Okay', onPress: () => {}},
				{text: 'Settings', onPress: () => Linking.openURL('app-settings:')}
			]
		);
		return
	}

	console.log("Voting now visible");
	this.setState({
		votingVisibile: true
	});
}

/// Dismisses all modals shown
hideModals() {
	this.setState({
		settingsVisible: false,
		peopleInLabVisible: false,
		votingVisibile: false
	});
}

/// Toggles a section (office hours or events) to expand or contract
toggleSectionGrow(section) {
	// Complicated terniary
	// Basically defines the height we want the office hours section to be after the animation
	// If selection is on the:
	//      office hours and the office hours are expanded, then return to default
	// 			office hours but the office hours are not expaned (either expanded or shrunk), go to expaned height
	// 			events and the events section was expanded, we must colapse back to default
	//      events and the events section was not expaned, expand events by shrinking
	let end = section == "officeHoursSelected" ? (this.state.officeHoursSelected ? officeHoursDefault : taHoursExpanded) : (this.state.eventsSelected ? officeHoursDefault : shrunkSize);

	// Update the state
	this.setState({
		officeHoursSelected: section == "officeHoursSelected" && !this.state.officeHoursSelected,
		eventsSelected: section == "eventsSelected" && !this.state.eventsSelected,
	});

	// Animate towards that beutifully calculated end height
	Animated.spring(this.state.officeHoursAnimationValue, {
		toValue: end
	}).start();
}

/**
Renders the Main view
VERY complicated
*/
render() {
	return (
		<LinearGradient colors={['#2696a9', 'rgb(146, 201, 210)']} style={styles.container}>
		{/* Creates a gradient view that acts as the background*/}
		{/* Controlls the modal presented views that branch off. Transitions using a slide up*/}
		<Modal
		animationType={"slide"}
		transparent={false}
		visible={this.state.settingsVisible || this.state.peopleInLabVisible || this.state.votingVisibile}
		onRequestClose={this.hideModals.bind(this)}>
		{this.state.settingsVisible ? <Settings
			user={this.props.user}
			onLogout={this.logout.bind(this)}
			dismiss={this.hideModals.bind(this)}/> : null}
			{this.state.peopleInLabVisible ? <PeopleInLab dismiss={this.hideModals.bind(this)}/> : null}
			{this.state.votingVisibile ? <EventVote dismiss={this.hideModals.bind(this)}/> : null}
			</Modal>

			<View style={{
				width: window.width,
				alignItems: 'center',
				flexDirection: 'row',
				marginTop: 20 + (Platform.OS == "ios" ? 10 : 0)
			}}>
			{/* Voting button*/}
			<TouchableHighlight
			underlayColor="rgba(0,0,0,0)"
			style={{marginLeft: 20, alignSelf: 'flex-start'}}
			onPress={this.state.inVotingEvent ? this.votingButtonPressed.bind(this) : null}>
			{this.state.inVotingEvent ? <Image source={require('./Assets/vote.png')} style={styles.settingsButtonImage}/> : <View style={{width: 30}}/>}
			</TouchableHighlight>

			{/* DALI image*/}
			<Image source={require('./Assets/DALI_whiteLogo.png')} style={[styles.daliImage, {width: window.width - 100}]}/>

			{/* Settings button*/}
			<TouchableHighlight
			underlayColor="rgba(0,0,0,0)"
			style={{marginRight: 20, alignSelf: 'flex-start'}}
			onPress={this.settingsButtonPressed.bind(this)}>
			<Image source={require('./Assets/whiteGear.png')} style={styles.settingsButtonImage}/>
			</TouchableHighlight>
			</View>

			{/* Location label. More complicated terniary*/}
			{this.props.user != null ?
				<Text style={styles.locationText}>{this.state.locationText}</Text>
				: <View style={{alignItems: 'center'}}>
				<TouchableHighlight onPress={() => {
					Linking.openURL("http://maps.apple.com/?address=5,Maynard+St,Hanover,New+Hampshire");
				}}
				underlayColor="rgba(0,0,0,0)">
				<Text style={[styles.locationText, {textDecorationLine: "underline", marginBottom: 0}]}>Open in Maps</Text>
				</TouchableHighlight>
				<TouchableHighlight onPress={() => {
					Linking.openURL("https://dali.dartmouth.edu");
				}}
				underlayColor="rgba(0,0,0,0)">
				<Text style={[styles.locationText, {textDecorationLine: "underline"}]}>Website</Text>
				</TouchableHighlight>
				</View>
			}

			{/* A view to rull all views (actually not all, as the Modal and LinearGradient aren't controlled by this)*/}
			<View style={styles.internalView}>
			{/* An animated view allows me to use both basic CSS and pointers to changing Animated values*/}
			<Animated.View style={[
				styles.topView,
				{height: this.state.officeHoursAnimationValue}
			]}>
			{/* Now we enter the office hours section*/}

			{/* A top seperator*/}
			<View style={styles.separatorThick}/>
			{/* The text for office hours, which is selectable so the user can expand and contract it*/}
			<TouchableHighlight
			underlayColor="rgba(0,0,0,0)"
			onPress={this.toggleSectionGrow.bind(this, 'officeHoursSelected')}>
			<Text style={styles.titleText}>{
				this.props.user != null ?
				(this.state.officeHours == null ?
					"Loading TA office hours..." :
					(this.state.officeHours.length > 0 ?
						"TA office hours tonight!" :
						"No TA office hours tonight"
					))
					: "Description"
				}</Text>
				</TouchableHighlight>

				{/* Another separator*/}
				<View style={styles.separatorThin}/>

				{/* Here is where it gets interesting! This is the actual list view, but most of it's rendering is done in renderRow*/}
				{this.props.user != null ?
					<ListView
					enableEmptySections={true}
					style={styles.listView}
					dataSource={this.state.officeHoursDataSource}
					renderRow={this.renderOfficeHoursRow.bind(this)}/>
					: <Text style={styles.daliDescText}>We design and build technology tools to help our partners change behavior, enhance understanding and even create delight.  DALI uses mindful design to create solutions to a wide variety of problems.</Text>
				}
				</Animated.View>

				{/* Moving on to the events section*/}
				{/* This one actually doesnt need to animate.
					It seems to grow and shrink, as it is pushed and pulled down and up behind the toolbar below,
					but nothing more than a cleverly hidden opaque toolbar view is needed for this effect.
					I just use a terniary operator to switch between large and normal height*/}
					<View style={[styles.bottomView, this.state.eventsSelected ? {height: eventsExpanded} : null]}>

					{/* I swear, this is the last seperator*/}
					<View style={styles.separatorThick}/>
					{/* Again, touchable text*/}
					<TouchableHighlight
					underlayColor="rgba(0,0,0,0)"
					onPress={this.toggleSectionGrow.bind(this, 'eventsSelected')}>
					<Text style={styles.titleText}>Upcoming Events</Text>
					</TouchableHighlight>
					{/* Sike! One more seperator*/}
					<View style={styles.separatorThin}/>

					{/* The other list view*/}
					<ListView
					enableEmptySections={true}
					style={styles.listView}
					dataSource={this.state.eventsDataSource}
					renderRow={this.renderEventRow.bind(this)}/>
					</View>
					</View>

					{/* Aforementioned cleverly hidden opaque toolbar view.
						Instead of trying to perfect the timing on another animation for the events list view or making a hideus solid toolbar,
						I just created another gradient that ends on the color where the view ends and starts at the color where the view starts.
						In effect creating an opaque but seemingly nonexistant background!*/}
						{this.props.user != null ?
							<LinearGradient colors={['rgb(138, 196, 205)', 'rgb(146, 201, 210)']} style={styles.toolbarView}>

							{false ? <View>
								<View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0)'}}/>
								{/* Empty and clear view to make the buttons equidistant*/}

								{/* Food button*/}
								<TouchableHighlight
								underlayColor="rgba(0,0,0,0)"
								onPress={() => {}}>
								<Image source={require('./Assets/food.png')} style={styles.settingsButtonImage}/>
								</TouchableHighlight>
								</View>: null}

								{/* Empty and clear view to make the buttons equidistant*/}
								<View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0)'}}/>

								{/* People button*/}
								<TouchableHighlight
								underlayColor="rgba(0,0,0,0)"
								onPress={this.peopleInLabPressed.bind(this)}>
								<Image source={require('./Assets/people.png')} style={styles.settingsButtonImage}/>
								</TouchableHighlight>

								{/* Empty and clear view to make the buttons equidistant*/}
								<View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0)'}}/>
								</LinearGradient> : null}
								</LinearGradient>
							)
						}
					}

					// This a huge list of styles! Not gonna comment it
					const styles = StyleSheet.create({
						container: {
							flex: 1,
							alignItems: 'center',
							justifyContent: 'center',
						},
						daliDescText: {
							marginTop: 15,
							marginRight: 40,
							marginLeft: 40,
							backgroundColor: 'rgba(0,0,0,0)',
							color: 'white',
							fontFamily: 'Avenir Next',
							fontSize: 15,
							flex: 1
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
						weekSeperator: {
							flexDirection: 'row',
							justifyContent: 'center',
							alignItems: 'center',
							paddingTop: 5,
						},
						weekSeperatorLine: {
							flex: 1,
							height: 1.5,
							marginRight: 5,
							marginLeft: 5,
							backgroundColor: 'white'
						},
						weekSeperatorText: {
							marginRight: 5,
							fontFamily: 'Avenir Next',
							marginLeft: 5,
							fontWeight: '700',
							backgroundColor: 'rgba(0,0,0,0)',
							color: 'white'
						},
						row: {
							paddingTop: 10,
							backgroundColor: 'rgba(0, 0, 0, 0)',
							width: window.width - 83,
							marginBottom: 5,
							marginTop: 5,
							flexDirection: 'row'
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
						daliImage: {
							height: 50,
							width: 100,
							resizeMode: 'contain'
						}
					});

					module.exports = Main
