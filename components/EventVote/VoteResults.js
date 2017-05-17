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

class VoteResults extends Component {
   propTypes: {
      results: ReactNative.PropTypes.object.isRequired,
   }

   render() {
      return (
         <View/>
      );
   }
}

module.exports = VoteResults;
