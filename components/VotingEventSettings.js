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

class VotingEventSettings extends Component {
   constructor(props) {
      super(props);

      this.state = {};
   }

   render() {
      return (
         <View style={styles.container}>

         </View>
      );
   }
}

const styles = StyleSheet.create({
   container: {
      flex: 1
   }
});

module.exports = VotingEventSettings;
