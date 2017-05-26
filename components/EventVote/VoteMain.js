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
      hasVoted: ReactNative.PropTypes.Boolean.isRequired,
   }

   constructor(props) {
      super(props);

      this.state = {
         hasVoted: props.hasVoted,
         results: null,
         event: null,
      };

      ServerCommunicator.current.getEventNow().then((event) => {
         if (event == null) {
            setTimeout(() => {
               Alert.alert("No Current Event", "There is no event going on currently", [
                  {text: 'OK', onPress: this.props.dismiss}
               ], { cancelable: false })
            }, 600);
            return;
         }

         event.options = event.options.sort((option1, option2) => {
            if (option1.name == option2.name) {
               return 0;
            }

            return option1.name > option2.name ? 1 : -1
         });

         this.setState({
            event: event
         });

         return StorageController.getVoteDone(event).then((value) => {
            this.setState({
               hasVoted: value
            });
         });
      }).catch((error) => {
         if (error.code == 404) {
            setTimeout(() => {
               Alert.alert("No Current Event", "There is no event going on currently", [
                  {text: 'OK', onPress: this.props.dismiss}
               ], { cancelable: false })
            }, 600);
         }
      });

      this.reloadInterval = setInterval(this.updateResults.bind(this), 1000 * 5);

      this.updateResults();
   }

   componentWillUnmount() {
      console.log("Clearing");
      clearInterval(this.reloadInterval);
      this.reloadInterval = null;
   }

   updateResults() {
      console.log("Wating...");
      ServerCommunicator.current.getVotingResults().then((results) => {
         this.setState({
            results: results
         });
      }).catch((error) => {
         if (error.code != 400) {
            console.log(error);
         }
      });
   }

   renderInternal(route, navigator) {
      var internalView = <VoteWait loading={true}/>

      if (this.state.event != null) {
         internalView = <VoteSelection ref={(voteSelection) => { this.voteSelection = voteSelection; }}/>;

         if (route.name == "VoteOrder") {
            internalView = <VoteOrder voteComplete={() => {
               this.updateResults();
               this.setState({
                  hasVoted: true
               });
               StorageController.setVoteDone(this.event).then(() => {});
               this.updateResults();
            }}
            selectedOptions={route.selectedOptions}
            ref={(voteOrder) => { this.voteOrder = voteOrder; }}/>
         }

         console.log(this.state);
         if (this.state.hasVoted) {
            if (this.voteSelection != null) {
               this.voteSelection.visible = false;
            }
            internalView = <VoteWait event={this.state.event}/>;
         }
         if (this.state.results != null) {
            if (this.voteSelection != null) {
               this.voteSelection.visible = false;
            }
            internalView = <VoteResults results={this.state.results}/>;
         }
      }

      return internalView;
   }

   submitVotes() {
      var order = this.voteOrder.state.order;
      var choices = this.voteOrder.state.selectedOptions;

      var orderedChoices = [];
      for (var i = 0; i < order.length; i ++) {
         var index = parseInt(order[i]);
         orderedChoices.push(choices[index]);
      }
      console.log(orderedChoices);
      ServerCommunicator.current.submitVotes(
         orderedChoices[0].id,
         orderedChoices[1].id,
         orderedChoices[2].id,
         this.state.event
      )
      .then(() => {
         this.setState({
            hasVoted: true,
         });
         StorageController.setVoteDone(this.state.event).then(() => {});
      }).catch((error) => {
         if (error.code == 405) {
            StorageController.setVoteDone(this.state.event).then(() => {});
         }
         console.log(error.message);
         Alert.alert("Encountered an error", error.message);
      });
   }

   render() {

      return (
         <Navigator
         initialRoute={{name: "VoteSelection"}}
         navigationBar={
            <Navigator.NavigationBar
            routeMapper={{
               LeftButton: (route, navigator, index, navState) => {
                  if (this.state.hasVoted || this.state.results != null) {
                     return null;
                  }else if (route.name == "VoteOrder"){
                     return (
                        <TouchableHighlight
                        underlayColor="rgba(0,0,0,0)"
                        style={styles.navBarCancelButton}
                        onPress={navigator.pop}>
                        <Text style={styles.navBarCancelText}>{"Back"}</Text>
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

                  var text = ""
                  var func = () => {}

                  if (!this.state.hasVoted && this.state.results == null) {
                     // We are on Voting selection
                     if (route.name == "VoteSelection") {
                        func = () => this.voteSelection.nextPressed(navigator);
                        text = "Next";
                     }else{
                        func = this.submitVotes.bind(this);
                        text = "Done";
                     }
                  }else{
                     text = "Done";
                     func = this.props.dismiss;
                  }

                  return (
                     <TouchableHighlight
                     underlayColor="rgba(0,0,0,0)"
                     style={styles.navBarDoneButton}
                     onPress={func}>
                     <Text style={styles.navBarDoneText}>{text}</Text>
                     </TouchableHighlight>
                  );
               },
               Title: (route, navigator, index, navState) => {
                  return (<Text style={styles.navBarTitleText}>{this.state.results != null ? "Results" : "Voting"} for {this.state.event == null ? 'Event...' : this.state.event.name}</Text>);
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
