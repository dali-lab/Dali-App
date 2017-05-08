import React, { Component } from 'react';
import {
   AppRegistry,
   StyleSheet,
   Text,
   View,
   TouchableHighlight,
   ListView,
   Image,
   Alert,
   Dimensions,
   Navigator
} from 'react-native';
let ServerCommunicator = require('./ServerCommunicator').default;

class EventVote extends Component {

   constructor(props) {
     super(props);

     this.state = {
        eventData: null
     };

     ServerCommunicator.current.getEventNow().then((event) => {
        this.setState({
           eventData: event
        })
     })
   }

   render() {
     return (
        <Navigator
        navigationBar={
           <Navigator.NavigationBar
           routeMapper={{
              LeftButton: (route, navigator, index, navState) => {
                 return (null);
              },
              RightButton: (route, navigator, index, navState) => {
                 // Done Button
                 return (
                    <TouchableHighlight
                    underlayColor="rgba(0,0,0,0)"
                    style={styles.navBarDoneButton}
                    onPress={this.props.dismiss}>
                    <Text style={styles.navBarDoneText}>Done</Text>
                    </TouchableHighlight>
                 );
              },
              Title: (route, navigator, index, navState) => {
                 return (<Text style={styles.navBarTitleText}>Voting for {this.state.eventData == null ? 'Event...' : this.state.eventData.name}</Text>);
              }
           }}
           style={{backgroundColor: 'rgb(33, 122, 136)'}}/>
        }
        renderScene={(route, navigator) =>
           <View/>
        }
        style={{paddingTop: 65}}/>
     );
   }
}

const styles = StyleSheet.create({
   navBarTitleText: {
      color: 'white',
      fontFamily: 'Avenir Next',
      fontSize: 18,
      fontWeight: '500',
      marginTop: 15
   },
   navBarDoneText: {
      color: 'rgb(89, 229, 205)',
      fontFamily: 'Avenir Next',
      fontSize: 18,
      fontWeight: '500',
   },
   navBarDoneButton: {
      marginTop: 10,
      marginRight: 10
   },
});

module.exports = EventVote
