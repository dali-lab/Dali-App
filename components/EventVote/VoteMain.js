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
let ServerCommunicator = require('../ServerCommunicator').default;
const VoteSelection = require('./VoteSelection');
const VoteOrder = require('./VoteOrder');
const VoteWait = require('./VoteWait');
const VoteResults = require('./VoteResults');
let StorageController = require('../StorageController').default;

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

      ServerCommunicator.current.getEventNow().then((event) => {
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
      }).catch((error) => {
         if (error.code == 404) {
            setTimeout(() => {
               Alert.alert("No Current Event", "There is no event going on currently", [
                  {text: 'OK', onPress: this.props.dismiss}
               ], { cancelable: false })
            }, 600);
         }
      });
   }

   updateResults() {
      ServerCommunicator.current.getVotingResults().then((results) => {
         this.setState({
            results: results
         });

         if (results == null) {
            setTimeout(() => {
               this.updateResults();
               console.log("Reloading...");
            }, 1000 * 30); // One minute
         }
      });
   }

   renderInternal(route, navigator) {
      var internalView = <VoteSelection ref={(voteSelection) => { this.voteSelection = voteSelection; }}/>;

      if (route.name == "VoteOrder") {
         internalView = <VoteOrder voteComplete={() => {
            this.updateResults();
            this.setState({
               hasVoted: true
            });
            StorageController.setVoteDone(this.event);
         }}
         selectedOptions={route.selectedOptions}
         ref={(voteOrder) => { this.voteOrder = voteOrder; }}/>
      }

      if (this.state.hasVoted) {
         internalView = <VoteWait event={this.state.event}/>;
         if (this.state.results != null) {
            internalView = <VoteResults results={this.state.results}/>;
         }
      }

      return internalView;
   }

   render() {

      return (
         <Navigator
         initialRoute={{name: "VoteSelection"}}
         navigationBar={
            <Navigator.NavigationBar
            routeMapper={{
               LeftButton: (route, navigator, index, navState) => {
                  if (this.state.hasVoted) {
                     return null;
                  }else if (route.name == "VoteOrder"){
                     return (
                        <TouchableHighlight
                        underlayColor="rgba(0,0,0,0)"
                        style={styles.navBarCancelButton}
                        onPress={navigator.pop}>
                        <Text style={styles.navBarCancelText}>{"< Back"}</Text>
                        </TouchableHighlight>
                     );
                  }else{
                     return (
                        <TouchableHighlight
                        underlayColor="rgba(0,0,0,0)"
                        style={styles.navBarCancelButton}
                        onPress={this.props.dismiss}>
                        <Text style={styles.navBarCancelText}>Cancel</Text>
                        </TouchableHighlight>
                     );
                  }
               },
               RightButton: (route, navigator, index, navState) => {
                  // Done Button

                  return (
                     <TouchableHighlight
                     underlayColor="rgba(0,0,0,0)"
                     style={styles.navBarDoneButton}
                     onPress={() => {
                        if (!this.state.hasVoted && this.voteSelection != null) {
                           // Then we have not yet moved on from voting
                           if (route.name == "VoteSelection") {
                              this.voteSelection.nextPressed(navigator);
                           }else{
                              this.voteOrder.donePressed();
                           }
                        }else{
                           this.props.dismiss();
                        }
                     }}>
                     <Text style={styles.navBarDoneText}>{route.name != "VoteSelection" ? "Done" : "Next"}</Text>
                     </TouchableHighlight>
                  );
               },
               Title: (route, navigator, index, navState) => {
                  return (<Text style={styles.navBarTitleText}>Voting for {this.state.event == null ? 'Event...' : this.state.event.name}</Text>);
               }
            }}
            style={{backgroundColor: 'rgb(33, 122, 136)'}}/>
         }
         renderScene={(route, navigator) =>
            <View style={{flex: 1}}>
            {this.renderInternal(route, navigator)}
            </View>
         }
         style={{paddingTop: 64}}/>
      );
   }
}

const styles = StyleSheet.create({
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
      fontWeight: '500',
   },
   navBarCancelText: {
      color: 'rgb(89, 229, 205)',
      fontFamily: 'Avenir Next',
      fontSize: 18,
      fontWeight: '300',
   },
   navBarDoneButton: {
      marginTop: 10,
      marginRight: 10,
   },
   navBarCancelButton: {
      marginTop: 10,
      marginLeft: 10,
   }
});

module.exports = VoteMain;
