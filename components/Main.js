/**
* Main.js
* Presents the main interface for the DALI Lab app.
* Included in this view is:
* 	- ListView of TA Office Hours
* 	- ListView of Upcoming events
*
* AUTHOR: John Kotz
* Copyright (c) 2017 DALI Lab and John Kotz All Rights Reserved.
*/

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  ListView,
  Image,
  Modal,
  Dimensions,
  AppState,
  Linking,
  Platform,
  Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { GoogleSignin } from 'react-native-google-signin';

// My Components and classes
const ServerCommunicator = require('./ServerCommunicator').default;
const BeaconController = require('./BeaconController').default;
const Settings = require('./Settings/Settings');
const PeopleInLab = require('./PeopleInLab');
const EventVote = require('./EventVote/VoteMain');
const StorageController = require('./StorageController').default;


const window = Dimensions.get('window');

/**
Formats the given events into a simple start - end format
eg. Sun 12 - 1:30 PM

PARAMETERS:
- start: Start date
- end: End date

RETURNS: String
*/
function formatEvent(start, end) {
  const weekDays = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];

  function formatTime(time) {
    let hours = time.getHours();

    if (hours > 12) {
      hours -= 12;
    }

    return hours.toString() + (time.getMinutes() === 0 ? '' : `:${time.getMinutes().toString()}`);
  }

  return `${weekDays[start.getDay()]} ${formatTime(start)} - ${formatTime(end)} ${(start.getHours() + 1) >= 12 ? 'PM' : 'AM'}`;
}

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
   super();

   // All very important and not at all understandable:
   this.state = {
     // The data source for the office hours list view
     officeHoursDataSource: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 }),
     // The data source for the events list view
     eventsDataSource: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 }),
     // Indicates whether the Settings component is currently presented over the Main
     settingsVisible: false,
     // Indicates whether the PeopleInLab component is currently presented over the Main
     peopleInLabVisible: false,
     // Indicates whether the office hours list view is currently expanded (Read more: toggleSectionGrow)
     officeHoursSelected: false,
     // Indicates whether the events list view is currently expanded (Read more: toggleSectionGrow)
     eventsSelected: false,
     votingDone: false,
     // Holds the data I will get about the office hours
     officeHours: null,
     locationText: 'Loading location...',
     inVotingEvent:  __DEV__,
     votingVisibile: false,
     // The current state of the application (background or foreground)
     // Will come in handy when reloading data on re-entry to the app
     appState: AppState.currentState,
   };

   BeaconController.current.addLocationInformationListener((locationText) => {
     this.setState({
       locationText
     });
   });

   BeaconController.current.addVotingRegionListener((enter) => {
     this.setState({
       inVotingEvent: enter
     });
   });
 }

 componentDidMount() {
   // Sets up a listener that will be triggered when the the app switches between background and foreground (or vise versa)
   AppState.addEventListener('change', this._handleAppStateChange);

   // Get the data to be shown
   this.refreshData();
 }

 componentWillUnmount() {
   AppState.removeEventListener('change', this._handleAppStateChange);

   clearInterval(this.reloadInterval);
   this.reloadInterval = null;
 }

  // / Shows the Settings modal
 settingsButtonPressed() {
   this.setState({
     settingsVisible: true
   });
 }

  /**
	Logout and notify the index.__.js to switch to Login
	*/
 logout() {
   if (this.props.user === null) {
     this.props.onLogout();
   }

   GoogleSignin.signOut()
     .then(() => {
       this.props.onLogout();
     })
     .catch((err) => {
       console.log(err);
     });
   clearInterval(this.reloadInterval);
   this.reloadInterval = undefined;
 }

  /**
	Refreshes the data that is to be presented.
	This includes:
	- Office hours
	- Upcoming events
	- Current location (ie. in lab or not)
	*/
 refreshData() {
   if (this.reloadInterval === null) {
     console.log('Making interval');
     this.reloadInterval = setInterval(() => {
       this.refreshData();
     }, 1000 * 60);
   }

   this.refreshVotingData();

   console.log('Refreshing...');
   // Retrieve office hours
   ServerCommunicator.current.getUpcomingEvents().then((events) => {
     console.log('Got events...');
     console.log(events);
     let i = 0;
     while (i < events.length) {
       const event = events[i];
       if (event.today && i === 0) {
         events.splice(i, 0, 'TODAY SEPERATOR');
         i++;
       } else if (!event.nextWeek && !event.today && (i > 0 ? events[i - 1].today : true)) {
         events.splice(i, 0, 'THIS WEEK SEPERATOR');
         i++;
       } else if (event.nextWeek) {
         events.splice(i, 0, 'NEXT WEEK SEPERATOR');
         break;
       }
       i++;
     }

     this.setState({
       // Same as above, but with the events
       eventsDataSource: this.state.eventsDataSource.cloneWithRows(events)
     });

     if (events.length > 0) {
       // Again, same as before:
       // Auto refresh when an event ends
       let i = 0;
       let first = events[0];
       while (i < events.length && first.endDate === undefined) {
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
   // BeaconController.current.startRanging();

   if (this.reloadInterval === null) {
     this.reloadInterval = setInterval(() => {
       this.refreshData();
     }, 1000 * 60 * 5);
   }
 }


 refreshVotingData() {
   ServerCommunicator.current.getEventNow().then((event) => {
     if (event) {
       StorageController.getVoteDone(event).then((value) => {
         this.setState({
           votingDone: value
         });
       });
     }
   }).catch((error) => {
     if (error && error.code === 404) {
       this.setState({
         votingDone: false,
         inVotingEvent: false
       });
     }
   });
 }

  // / Shows the PeopleInLab modal
 peopleInLabPressed() {
   this.setState({
     peopleInLabVisible: true
   });
 }

 votingButtonPressed() {
   if (!BeaconController.current.inVotingEvent && !__DEV__) {
     Alert.alert('You are not at any event',
       'No voting event beacon was found nearby. The beacons use Bluetooth, so this may be because bluetooth is off. You might also not allow the app to access location, which is needed',
       [
         { text: 'Okay', onPress: () => {} },
         { text: 'Settings', onPress: () => Linking.openURL('app-settings:') }
       ]);
     return;
   }

   console.log('Voting now visible');
   this.setState({
     votingVisibile: true
   });
 }

  // / Dismisses all modals shown
 hideModals() {
   this.setState({
     settingsVisible: false,
     peopleInLabVisible: false,
     votingVisibile: false
   });
 }

 _handleAppStateChange = (nextAppState) => {
   // Refresh data if the app is coming into the foreground
   if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
     console.log('App has come to the foreground!');
     this.refreshData();
   } else {
     clearInterval(this.reloadInterval);
     this.reloadInterval = null;
   }
   this.setState({ appState: nextAppState });
 }


  // / Renders a row for an event and returns it
 renderEventRow(event) {
   if (event === 'TODAY SEPERATOR') {
     return (
       <View style={styles.weekSeperator}>
         <View style={styles.weekSeperatorLine} />
         <Text style={styles.weekSeperatorText}>Today</Text>
         <View style={styles.weekSeperatorLine} />
       </View>
     );
   } else if (event === 'THIS WEEK SEPERATOR') {
     return (
       <View style={styles.weekSeperator}>
         <View style={styles.weekSeperatorLine} />
         <Text style={styles.weekSeperatorText}>This Week</Text>
         <View style={styles.weekSeperatorLine} />
       </View>
     );
   } else if (event === 'NEXT WEEK SEPERATOR') {
     return (
       <View style={styles.weekSeperator}>
         <View style={styles.weekSeperatorLine} />
         <Text style={styles.weekSeperatorText}>Next Week</Text>
         <View style={styles.weekSeperatorLine} />
       </View>
     );
   }

   // It is touchable so the user can click it an open the event in a web-browser
   // underlayColor="rgba(0,0,0,0.1)" makes there be a slightly opaque overlay to be placed on the row when pressed
   return (
     <View style={styles.row}>
       <Text style={styles.leftRowText}>{event.summary}</Text>
       <View style={styles.rightRowView}>
         <Text style={styles.rowTitle}>{formatEvent(event.startDate, event.endDate)}</Text>
         <Text style={styles.detailText}>{event.location === '' ? event.description : event.location}</Text>
       </View>
     </View>
   );
 }
  // / Renders a row for a office hour and returns it
 renderOfficeHoursRow(hour) {
   return (
     <View style={styles.row}>
       <Text style={[styles.leftRowText, { width: 60 }]}>{hour.startDate.getHours() - 12} - {hour.endDate.getHours() - 12} pm</Text>
       <View style={styles.rightRowView}>
         <Text style={styles.rowTitle}>{hour.name}</Text>
         <Text style={styles.detailText}>{hour.skills}</Text>
       </View>
     </View>
   );
 }

  /**
	Renders the Main view
	VERY complicated
	*/
 render() {
   return (
     <LinearGradient colors={['#2696a9', 'rgb(146, 201, 210)']} style={styles.container}>
       {/* Creates a gradient view that acts as the background */}
       {/* Controlls the modal presented views that branch off. Transitions using a slide up */}
       <Modal
         animationType={'slide'}
         transparent={false}
         visible={this.state.settingsVisible || this.state.peopleInLabVisible || this.state.votingVisibile}
         onRequestClose={this.hideModals.bind(this)}
       >
         {this.state.settingsVisible ? <Settings
           user={this.props.user}
           onLogout={this.logout.bind(this)}
           dismiss={this.hideModals.bind(this)}
         /> : null
         }
         {this.state.peopleInLabVisible ? <PeopleInLab dismiss={this.hideModals.bind(this)} /> : null}
         {this.state.votingVisibile ? <EventVote
           dismiss={() => {
             this.refreshVotingData();
             this.hideModals();
           }}
           hasVoted={this.state.votingDone}
         /> : null}
       </Modal>

       <View style={{
         width: window.width,
         alignItems: 'center',
         flexDirection: 'row',
         marginTop: 20 + (Platform.OS === 'ios' ? 10 : 0)
       }}
       >
         {/* Voting button */}
         <TouchableHighlight
           underlayColor="rgba(0,0,0,0)"
           style={{ marginLeft: 20, alignSelf: 'flex-start' }}
           onPress={this.state.inVotingEvent ? this.votingButtonPressed.bind(this) : null}
         >
           {this.state.inVotingEvent ? <Image source={this.state.votingDone ? require('./Assets/voteDone.png') : require('./Assets/vote.png')} style={styles.settingsButtonImage} /> : <View style={{ width: 30 }} />}
         </TouchableHighlight>

         {/* DALI image */}
         <Image source={require('./Assets/DALI_whiteLogo.png')} style={[styles.daliImage, { width: window.width - 100 }]} />

         {/* Settings button */}
         <TouchableHighlight
           underlayColor="rgba(0,0,0,0)"
           style={{ marginRight: 20, alignSelf: 'flex-start' }}
           onPress={this.settingsButtonPressed.bind(this)}
         >
           <Image source={require('./Assets/whiteGear.png')} style={styles.settingsButtonImage} />
         </TouchableHighlight>
       </View>

       {/* Location label. More complicated terniary */}
       {this.props.user != null ?
         <Text style={styles.locationText}>{this.state.locationText}</Text>
         : <View style={{ alignItems: 'center' }}>
           <TouchableHighlight
             onPress={() => {
               Linking.openURL('http://maps.apple.com/?address=5,Maynard+St,Hanover,New+Hampshire');
             }}
             underlayColor="rgba(0,0,0,0)"
           >
             <Text style={[styles.locationText, { textDecorationLine: 'underline', marginBottom: 0 }]}>Open in Maps</Text>
           </TouchableHighlight>
           <TouchableHighlight
             onPress={() => {
               Linking.openURL('https://dali.dartmouth.edu');
             }}
             underlayColor="rgba(0,0,0,0)"
           >
             <Text style={[styles.locationText, { textDecorationLine: 'underline' }]}>Website</Text>
           </TouchableHighlight>
         </View>
       }

       {/* A view to rull all views (actually not all, as the Modal and LinearGradient aren't controlled by this) */}
       <View style={styles.internalView}>
         {/* Moving on to the events section */}
         {/* This one actually doesnt need to animate.
					It seems to grow and shrink, as it is pushed and pulled down and up behind the toolbar below,
					but nothing more than a cleverly hidden opaque toolbar view is needed for this effect.
					I just use a terniary operator to switch between large and normal height */
         }
         <View style={[styles.bottomView]}>

           {/* I swear, this is the last seperator */}
           <View style={styles.separatorThick} />
           <Text style={styles.titleText}>Upcoming Events</Text>
           {/* Sike! One more seperator */}
           <View style={styles.separatorThin} />

           {/* The other list view */}
           <ListView
             enableEmptySections={true}
             style={styles.listView}
             dataSource={this.state.eventsDataSource}
             renderRow={this.renderEventRow.bind(this)}
           />
         </View>
       </View>

       {/* Aforementioned cleverly hidden opaque toolbar view.
					Instead of trying to perfect the timing on another animation for the events list view or making a hideus solid toolbar,
					I just created another gradient that ends on the color where the view ends and starts at the color where the view starts.
					In effect creating an opaque but seemingly nonexistant background! */
       }
       {this.props.user != null ?
         <LinearGradient colors={['rgb(138, 196, 205)', 'rgb(146, 201, 210)']} style={styles.toolbarView}>

           {false ? <View>
             <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0)' }} />
             {/* Empty and clear view to make the buttons equidistant */}

             {/* Food button */}
             <TouchableHighlight
               underlayColor="rgba(0,0,0,0)"
               onPress={() => {}}
             >
               <Image source={require('./Assets/food.png')} style={styles.settingsButtonImage} />
             </TouchableHighlight>
           </View> : null}

           {/* Empty and clear view to make the buttons equidistant */}
           <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0)' }} />

           {/* People button */}
           <TouchableHighlight
             underlayColor="rgba(0,0,0,0)"
             onPress={this.peopleInLabPressed.bind(this)}
           >
             <View>
               <Image source={require('./Assets/people.png')} style={styles.settingsButtonImage} />
             </View>
           </TouchableHighlight>

           {/* Empty and clear view to make the buttons equidistant */}
           <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0)' }} />
         </LinearGradient> : null
       }
     </LinearGradient>
   );
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
    height: (window.height / 2) - 110,
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

module.exports = Main;
