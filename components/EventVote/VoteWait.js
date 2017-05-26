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
let ServerCommunicator = require('../ServerCommunicator').default;
import LinearGradient from 'react-native-linear-gradient';

class VoteWait extends Component {
   propTypes: {
      loading: React.PropTypes.Type.Boolean
   }

   render() {
      return (
         <LinearGradient colors={['#2696a9', 'rgb(146, 201, 210)']} style={styles.container}>
         <Image source={require("../Assets/pitchLightBulb.png")} style={styles.image}/>
         <Text style={styles.text}>{this.props.loading ?
            "Thank you for voting. Waiting for results to be released..."
            :
            "Loading..."
         }</Text>
         </LinearGradient>
      );
   }
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      alignItems: "center",
   },
   text: {
      color: "white",
      padding: 10,
      fontFamily: "Futura",
      fontSize: 24,
      textAlign: "center"
   },
   image: {
      flex: 1,
      width: Dimensions.get("window").width,
      resizeMode: "cover"
   }
});

module.exports = VoteWait;
