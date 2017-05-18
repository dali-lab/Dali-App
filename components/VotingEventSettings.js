import React, { Component } from 'react';
import {
   AppRegistry,
   StyleSheet,
   Text,
   View,
   TouchableHighlight,
   ListView,
   Image,
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

      // ServerCommunicator.current.getEventNow().then((event) => {
      //    this.setState({
      //       event: event
      //    })
      // });
   }

   createPressed() {
      this.props.navigator.push({name:  "Create Voting Event Subsettings"});
   }

   render() {
      return (
         <View style={styles.container}>
            {this.state.event == null ?
               <Text>There is no event happening now. Create one below</Text>
               :
               <Text>There is an event happening now.</Text>
            }

            <TouchableHighlight
            onPress={this.createPressed.bind(this)}>
            <Text>Create</Text>
            </TouchableHighlight>
         </View>
      );
   }
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: 'rgb(238, 238, 238)'
   },

});

module.exports = VotingEventSettings;
