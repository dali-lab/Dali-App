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
import LinearGradient from 'react-native-linear-gradient';

class VoteWait extends Component {

   render() {
      return (
         <LinearGradient colors={['#2696a9', 'rgb(146, 201, 210)']} style={styles.container}>
         <Text>Thank you for voting. Waiting for results to be released</Text>
         </LinearGradient>
      );
   }
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   }
});

module.exports = VoteWait;
