/**
Settings.js
Defines a Settings component

AUTHOR: John Kotz
*/


import React, { Component } from 'react';
import {
	AppRegistry,
	StyleSheet,
	Text,
	View,
	TouchableHighlight,
	ListView,
	Image,
	Navigator,
	Switch
} from 'react-native';
import {GoogleSignin} from 'react-native-google-signin'

// My modules
const StorageController = require('../StorageController').default;
const GlobalFunctions = require('../GlobalFunctions').default;
let ServerCommunicator = require('../ServerCommunicator').default;
const VotingEventSettings = require('./VotingEventSettings');
const CreateVotingEventSettings = require('./CreateVotingEventSettings');


/**
The Settings component

PROPS:
- onLogout: Function to call in order to logout
- dismiss: Function to dismiss the modal
- user: Object with information about the user
*/
class Settings extends Component {
	propTypes: {
		onLogout: ReactNative.PropTypes.func,
		dismiss: ReactNative.PropTypes.func.isRequired,
		user: ReactNative.PropTypes.object,
	}

	constructor(props) {
		super(props)

		// The list view dataSource
		const dataSource = new ListView.DataSource({
			rowHasChanged: (r1, r2) => r1 !== r2,
			sectionHeaderHasChanged: (s1, s2) => s1 !== s2
		});

		this.state = {
			dataSource: dataSource.cloneWithRowsAndSections(this.getData(props)),
			// The default values of the settings
			checkInNotif: true,
			labAccessNotif: false,
			inLabLocShare: false,
			rightButtonDisabled: false
		}

		// Gets the lab access preference from the storage
		StorageController.getLabAccessPreference().then((value) => {
			if (value == null) {
				// Save the default value if there isn't one
				StorageController.saveLabAccessPreference(this.state.labAccessNotif);
				return;
			}

			this.setState({
				labAccessNotif: value
			});
		});

		// Get the preference for notifying the user on check-in
		StorageController.getCheckinNotifPreference().then((value) => {
			if (value == null) {
				// Save default...
				StorageController.saveCheckInNotifPreference(this.state.checkInNotif);
				return;
			}

			this.setState({
				checkInNotif: value
			});
		});

		// Get the preference of lab presence sharing
		StorageController.getLabPresencePreference().then((value) => {
			if (value == null) {
				// Save default...
				StorageController.saveCheckInNotifPreference(this.state.inLabLocShare);
				return;
			}

			this.setState({
				inLabLocShare: value
			});
		});
	}

	/**
	Retrieves the data regarding the sections and rows of the list
	*/
	getData() {
		var notificationsRows = [
			{
				title: "Event Check-in",
				detail: "Allow notifications when you are checked in to a DALI event.",
				switchChanged: (value) => {
					this.setState({
						checkInNotif: value,
						dataSource: this.state.dataSource.cloneWithRowsAndSections(this.getData(this.props)),
					})
					StorageController.saveCheckInNotifPreference(value);
				},
				stateName: "checkInNotif"
			},{
				title: "Lab Access",
				detail: "Notify me when I enter or exit the lab",
				switchChanged: (value) => {
					this.setState({
						labAccessNotif: value,
						dataSource: this.state.dataSource.cloneWithRowsAndSections(this.getData(this.props)),
					})

					StorageController.saveLabAccessPreference(value);
				},
				stateName: "labAccessNotif"
			}
		]

		var signInOutRow = {
			title: this.props.user != null ? "Sign Out" : "Sign In",
			action: this.props.onLogout,
			image: this.props.user != null ? this.props.user.photo : null
		}

		var locationRows = [
			{
				title: "Lab Presence Sharing",
				detail: "Share your presence in the lab with other members looking for your assistance",
				switchChanged: (value) => {
					this.setState({
						inLabLocShare: value,
						dataSource: this.state.dataSource.cloneWithRowsAndSections(this.getData(this.props)),
					})

					StorageController.saveLabPresencePreference(value);
					ServerCommunicator.current.updateSharePreference(value);
				},
				stateName: "inLabLocShare"
			}
		]

		var votingEventSetupRows = [
			{
				title: "Voting Event",
				action: () => {
					this.navigator.push({
						name: 'Voting Event',
					});
				}
			}
		]

		if (GlobalFunctions.userIsTim()) {
			// Tim gets automatic access to the voting rows, but because he is already tracked he can't share his information
			return {
				user: [signInOutRow],
				notifications: notificationsRows,
				voting: votingEventSetupRows
			}
		}else if (this.props.user != null){
			// This is a regular non-tim user
			if (GlobalFunctions.userIsAdmin()) {
				// This is theo, so he gets the voting options
				return {
					user: [signInOutRow],
					notifications: notificationsRows,
					location: locationRows,
					voting: votingEventSetupRows
				}
			}else{
				// A non-tim non-theo user
				return {
					user: [signInOutRow],
					notifications: notificationsRows,
					location: locationRows
				}
			}
		}else{
			// A non-user. All they get to do is sign in
			return {
				user: [signInOutRow]
			}
		}
	}

	/**
	Renders the rows
	*/
	renderRow(data, section, row) {
		if (section == 'user' || section == 'voting') {
			// The user cells are different
			return (
				<TouchableHighlight onPress={data.action}>
				<View>
				<View style={styles.userRow}>
				{data.image != null ? <Image source={{uri: data.image}} style={styles.userProfileImage}/> : null}
				<Text style={styles.userRowTitle}>{data.title}</Text>
				<Image source={require('../Assets/disclosureIndicator.png')} style={styles.disclosureIndicator}/>
				</View>
				<View style={styles.seperator}/>
				</View>
				</TouchableHighlight>
			)
		}

		// The other rows are all pretty simple
		return (
			<View>
			<View style={styles.notificationRow}>
			<View style={styles.notificationRowTextContainer}>
			<Text style={styles.notificationRowTitle}>{data.title}</Text>
			<Text style={styles.notificationRowDetail}>{data.detail}</Text>
			</View>
			<Switch
			value={this.state[data.stateName]}
			onValueChange={data.switchChanged}
			style={styles.notificationRowSwitch}/>
			</View>
			<View style={row == 0 ? styles.seperatorSmall : styles.seperator}/>
			</View>
		)
	}

	/**
	Gets a view of a section header
	*/
	renderSectionHeader(data, sectionName) {
		if (sectionName == "user") {
			return <View/>
		}

		return (
			<View style={styles.sectionHeader}>
			<Text style={styles.sectionHeaderText}>{sectionName.toUpperCase()}</Text>
			</View>
		)
	}

	/**
	Get footer
	*/
	renderFooter() {
		return (
			<View style={styles.sectionFooter}>
			<Text style={styles.sectionFooterText}>Developed by John Kotz; Designs by Kate Stinson and Jenny Seong</Text>
			</View>
		)
	}

	/// Renders the scene in the navigator. This is necessary, as Settings controlls all the subsequent Views.
	/// Not the best implementation, but there is little time for fancy but simple options
	renderScene(route, navigator) {
		this.navigator = navigator;

		if (route.name == 'Settings') {
			// Settings is a simple Listview that I have been setting up so far
			return (
				<ListView
				style={styles.listView}
				dataSource={this.state.dataSource}
				renderSectionHeader={this.renderSectionHeader.bind(this)}
				renderFooter={this.renderFooter.bind(this)}
				renderRow={this.renderRow.bind(this)}/>
			);
		}else if (route.name == 'Voting Event') {
			// Return the subview with the correct properties
			return (
				<VotingEventSettings
				rightButtonDisable={(bool) => this.setState({ rightButtonDisabled: bool }) }
				ref={(votingEventSettings) => {
					if (votingEventSettings == null) return;

					// If the reference has changed then I will reload the whole navigator
					if (this.votingEventSettings != votingEventSettings) {
						this.forceUpdate();
						console.log("Force updating voting...");
						this.votingEventSettings = votingEventSettings;
					}
				}}
				navigator={navigator}/>
			);
		}else if (route.name == 'Create Voting Event') {
			// Return the subview with the correct properties
			// I give this view a callback to call when it is done so I can force update the voting event settings view
			return (
				<CreateVotingEventSettings
				rightButtonDisable={(bool) => this.setState({ rightButtonDisabled: bool }) }
				ref={(createEventView) => {
					if (createEventView == null) return;

					// If the reference has changed then I will reload the whole navigator
					if (this.createEventView != createEventView) {
						this.forceUpdate();
						console.log("Force updating creating...");
						this.createEventView = createEventView;
					}
				}}
				complete={() => this.votingEventSettings.forceUpdate()}
				navigator={navigator}/>
			);
		}else{
			console.error("Unknown route name: ", route.name);
			return <View/>
		}
	}

	/// Called by the navigator to determine what the left button should be
	getLeftButton() {
		return null
	}

	/// Called by the navigator to get the title of the navigator
	getNavigationTitle() {
		return "Settings"
	}

	/**
	Render the view
	*/
	render() {
		// The navagator class is powerfull, and allows navigation bars
		return (
			<Navigator
			initialRoute={{ name: 'Settings' }}
			navigationBar={
				<Navigator.NavigationBar
				routeMapper={{
					LeftButton: (route, navigator, index, navState) => {
						// This is pretty cool. First I determine a reference to the view that is currently being displayed
						var currentView = null;
						if (route.name == "Create Voting Event") {
							currentView = this.createEventView;
						}else if (route.name == "Voting Event") {
							currentView = this.votingEventSettings;
						}else{
							currentView = this;
						}


						if (currentView != null && currentView.getLeftButton != undefined) {
							// If the current view has a preference on their left button...
							let leftButton = currentView.getLeftButton();
							// Get it and check it
							if (leftButton == null) {
								return null;
							}

							// And if they actually want something we'll give it to them
							return (
								<TouchableHighlight
								underlayColor="rgba(0,0,0,0)"
								style={styles.navBarBackButton}
								onPress={leftButton.action}>
								<Text
								style={[styles.navBarBackText, leftButton.style]}>
								{leftButton.text}
								</Text>
								</TouchableHighlight>
							);
						}else{
							// If we cannot get any information on what view we are on
							// or what that view wants for a left button, we will assume a back button
							return (
								<TouchableHighlight
								underlayColor="rgba(0,0,0,0)"
								style={styles.navBarBackButton}
								onPress={navigator.pop}>
								<Text style={styles.navBarBackText}>{"< Back"}</Text>
								</TouchableHighlight>
							);
						}
					},
					RightButton: (route, navigator, index, navState) => {
						// Very similar to the left button stuff
						// We get the current view
						var currentView = null;
						if (route.name == "Create Voting Event") {
							currentView = this.createEventView;
						}else if (route.name == "Voting Event") {
							currentView = this.votingEventSettings;
						}else{
							currentView = this;
						}

						if (currentView != null && currentView.getRightButton != undefined) {
							// If the view has a preference
							let rightButton = currentView.getRightButton();
							if (rightButton == null) {
								return null;
							}

							// Use it...
							return (
								<TouchableHighlight
								underlayColor="rgba(0,0,0,0)"
								style={styles.navBarDoneButton}
								onPress={!this.state.rightButtonDisabled ? rightButton.action : null}>
								<Text
								style={[styles.navBarDoneText, rightButton.stlye, this.state.rightButtonDisabled ? styles.navBarDisabled : null]}>
								{rightButton.text}
								</Text>
								</TouchableHighlight>
							);
						}else{
							// Otherwise assume Done button
							return (
								<TouchableHighlight
								underlayColor="rgba(0,0,0,0)"
								style={styles.navBarDoneButton}
								onPress={this.props.dismiss}>
								<Text style={styles.navBarDoneText}>Done</Text>
								</TouchableHighlight>
							);
						}
					},
					Title: (route, navigator, index, navState) => {
						// Default text will be based one the route name
						var text = route.name;
						if (this.state.currentView != null && this.state.currentView.getNavigationTitle) {
							// There is a preference
							text = this.state.currentView.getNavigationTitle();
						}
						return (<Text style={styles.navBarTitleText}>{text}</Text>);
					}
				}}
				style={{backgroundColor: 'rgb(33, 122, 136)'}}/>
			}
			renderScene={this.renderScene.bind(this)}
			style={{paddingTop: 65}}/>
		)
	}
}

const styles = StyleSheet.create({
	userProfileImage: {
		width: 25,
		height: 25,
		alignSelf: 'flex-start',
		resizeMode: 'contain',
		marginRight: 8,
		borderRadius: 70
	},
	dismissButton: {
		marginTop: 30
	},
	navBarTitleText: {
		color: 'white',
		fontFamily: 'Avenir Next',
		fontSize: 18,
		fontWeight: '500',
		marginTop: 10
	},
	navBarDoneText: {
		color: 'rgb(89, 229, 205)',
		fontFamily: 'Avenir Next',
		fontSize: 18,
		fontWeight: '600',
	},
	navBarBackText: {
		color: 'rgb(89, 229, 205)',
		fontFamily: 'Avenir Next',
		fontSize: 18,
		fontWeight: '500',
	},
	navBarDoneButton: {
		marginTop: 10,
		marginRight: 10
	},
	navBarBackButton: {
		marginTop: 10,
		marginLeft: 10,
	},
	navBarDisabled: {
		color: 'rgb(83, 163, 148)'
	},
	listView: {
		flex: 1,
		backgroundColor: 'rgb(238, 238, 238)'
	},
	seperator: {
		height: 1,
		backgroundColor: 'rgb(200, 200, 200)',
		flex: 1
	},
	seperatorSmall: {
		height: 1,
		marginLeft: 20,
		backgroundColor: 'rgb(200, 200, 200)',
		flex: 1
	},
	sectionHeader: {
		flex: 1,
		height: 50,
		flexDirection: 'row',
		backgroundColor: 'rgb(238, 238, 238)'
	},
	sectionHeaderText: {
		alignSelf: 'flex-end',
		marginBottom: 10,
		marginLeft: 10,
		fontSize: 10,
		fontFamily: 'Avenir Next',
		fontWeight: '600',
		color: 'grey'
	},
	sectionFooter: {
		marginTop: 10,
		marginLeft: 10
	},
	sectionFooterText: {
		fontSize: 12,
		fontFamily: 'Avenir Next',
		fontWeight: '400',
		color: 'grey'
	},
	notificationRow: {
		padding: 10,
		paddingBottom: 18,
		backgroundColor: 'white',
		paddingLeft: 20,
		flexDirection: 'row',
		flex: 1
	},
	notificationRowTextContainer: {
		flex: 1
	},
	notificationRowTitle: {
		fontSize: 18,
		fontFamily: 'Avenir Next',
		marginBottom: 11
	},
	notificationRowDetail: {
		fontSize: 13,
		fontFamily: 'Avenir Next',
		fontWeight: '400',
		marginRight: 53,
		color: 'grey'
	},
	notificationRowSwitch: {
		marginRight: 10
	},
	userRow: {
		padding: 10,
		backgroundColor: 'white',
		paddingLeft: 15,
		paddingBottom: 15,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center'
	},
	disclosureIndicator: {
		alignSelf: 'flex-end',
		resizeMode: 'contain',
		height: 15,
		width: 15,
		marginBottom: 4,
	},
	userRowTitle: {
		fontSize: 16,
		paddingLeft: 2,
		marginTop: 5,
		justifyContent: 'center',
		flex: 1,
		fontFamily: 'Avenir Next',
	}
});

module.exports = Settings
