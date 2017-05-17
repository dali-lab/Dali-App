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
const VoteSelection = require('./VoteSelection');
const VoteWait = require('./VoteWait');
const VoteResults = require('./VoteResults');
let StorageController = require('./StorageController').default;

class VoteMain extends Component {
   propTypes: {
      dismiss: ReactNative.PropTypes.func.isRequired,
   }

   constructor(props) {
      super(props);

      this.state = {
         hasVoted: false,
         results: null,
         event: null,
      };

      ServerCommunicator.getEventNow().then((event) => {
         this.setState({
            event: event
         });

         if (event == null) {
            setTimeout(() => {
               Alert.alert("No Current Event", "There is no event going on currently", [
                  {text: 'OK', onPress: this.props.dismiss}
               ], { cancelable: false })
            }, 600);
         }else{
            return StorageController.getVoteDone(event).then((value) => {
               this.setState({
                  hasVoted: value && !event.resultsReleased
               });

               if (event.resultsReleased) {
                  this.updateResults();
               }
            });
         }
      });
   }

   updateResults() {
      ServerCommunicator.getVotingResults().then((results) => {
         this.setState({
            results: results
         });

         if (results == null) {
            setTimeout(() => {
               this.updateResults();
            }, 1000 * 60); // One minute
         }
      });
   }

   render() {
      var internalView = <VoteSelection voteComplete={() => {
         this.updateResults();
         this.setState({
            hasVoted: true;
         });
         StorageController.setVoteDone(this.event);
      }}/>;

      if (this.state.hasVoted) {
         internalView = <VoteWait/>;
         if (this.state.results != null) {
            internalView = <VoteResults results=this.state.results/>;
         }
      }


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
            {internalView}
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
   }
});

module.exports = VoteMain;
