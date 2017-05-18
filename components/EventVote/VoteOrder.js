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

class VoteOrder extends Component {
   propTypes: {
      voteComplete: ReactNative.PropTypes.func.isRequired,
      selectedOptions: ReactNative.PropTypes.Object.isRequired,
   }

   donePressed() {

   }

   render() {
     return (
        <View style={styles.container}/>
     );
   }
}

const styles = StyleSheet.create({
   container: {
      backgroundColor: "white",
      flex: 1
   }
});

module.exports = VoteOrder
