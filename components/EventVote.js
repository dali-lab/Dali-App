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

const window = Dimensions.get('window')

class EventVote extends Component {
   propTypes: {
      dismiss: ReactNative.PropTypes.func.isRequired,
   }

   constructor(props) {
      super(props)

      // The list view dataSource
		const dataSource = new ListView.DataSource({
			rowHasChanged: (r1, r2) => r1 !== r2
		});

      this.state = {
         eventData: null,
         dataSource: dataSource
      }

      ServerCommunicator.current.getEventNow().then((event) => {
         this.setState({
            eventData: event,
            dataSource: dataSource.cloneWithRows(event.options)
         });
      });
   }

   renderRow(option) {
      return (
         <View style={styles.row}>
            <Text style={styles.rowText}>{option.name}</Text>
         </View>
      );
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
            <View>
               <View style={styles.headerView}>
                  <Text style={styles.headerText}>{this.state.eventData == null ? "Loading..." : this.state.eventData.description}</Text>
               </View>
               <ListView
               style={styles.listView}
               dataSource={this.state.dataSource}
   				renderRow={this.renderRow.bind(this)}/>
            </View>
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
   headerView: {
      padding: 10,
      backgroundColor: 'rgb(246, 246, 246)'
   },
   headerText: {
      fontFamily: "Avenir Next"

   },
   container: {

   },
   row: {
      padding: 10
   },
   rowText: {
      fontSize: 20,
      fontFamily: "Avenir Next"
   },
   listView: {

   }
})

module.exports = EventVote
