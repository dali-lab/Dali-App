import React, { Component } from 'react';
import {
   AppRegistry,
   StyleSheet,
   Text,
   View,
   TouchableHighlight,
   ListView,
   Image,
   Dimensions
} from 'react-native';

let ServerCommunicator = require('./ServerCommunicator').default;

class VotingEventSettings extends Component {
   propTypes: {
      navigator: React.PropTypes.Object.isRequired
   }

   constructor(props) {
      super(props);

      this.state = {
         event: null
      };

      ServerCommunicator.current.getEventNow().then((event) => {
         this.setState({
            event: event
         })
      });
   }

   createPressed() {
      this.props.navigator.push({name:  "Create Voting Event Subsettings"});
   }

   render() {
      return (
         <View style={styles.container}>
         <View style={styles.topView}>
         {this.state.event == null ?
            <Text style={styles.currentEventText}>There is no event happening now. Create one below</Text>
            :
            <View>
            <Text style={styles.currentEventText}>Current Event:</Text>
            </View>
         }
         </View>
         <TouchableHighlight
         underlayColor={'rgb(101, 161, 184)'}
         style={styles.createButton}
         onPress={this.createPressed.bind(this)}>
         <Text style={styles.createButtonText}>Create</Text>
         </TouchableHighlight>
         </View>
      );
   }
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: 'rgb(238, 238, 238)',
      alignItems: 'center'
   },
   topView: {
      flex: 1,
   },
   createButton: {
      width: Dimensions.get('window').width,
      alignItems: 'center',
      padding: 10,
      backgroundColor: 'rgb(116, 184, 209)'
   },
   createButtonText: {
      color: 'white',
      textAlign: 'center',
      fontSize: 20,
      fontFamily: "Avenir Next",
      fontWeight: "500"
   },
   currentEventText: {
      fontSize: 16,

   }
});

module.exports = VotingEventSettings;
