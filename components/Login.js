'use strict';

import React, { Component } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableHighlight,
  Animated,
  Easing,
  Alert,
  AlertIOS,
} from 'react-native';
import {GoogleSignin, GoogleSigninButton} from 'react-native-google-signin';

class Login extends Component {
  propTypes: {
		onLogin: ReactNative.PropTypes.func,
  }

  constructor(props) {
    super(props);

    this.state = {
      animateDone: false,
      slidingAnimationValue: new Animated.ValueXY({ x: 0, y: 75 }),
      fadeAnim: new Animated.Value(0)
    }
  }

  componentDidMount() {
    const animationConfig = {
      duration: 1500, // milliseconds
      delay: 1000, // milliseconds
      easing: Easing.inOut(Easing.ease),
    };

    const value = this.state.slidingAnimationValue;
    const slidingInAnimation = Animated.timing(value, {
      ...animationConfig, // ES6 spread operator
      toValue: {
        x: 0,
        y: 0,
      },
    }).start(() => {
      this.setState({
        animateDone: true
      });
      Animated.timing(          // Uses easing functions
         this.state.fadeAnim,    // The value to drive
         {toValue: 1}            // Configuration
       ).start();
    });
  }

  render() {
    const slidingAnimationStyle = this.state
     .slidingAnimationValue
     .getTranslateTransform();

    return (

        <View style={styles.container}>
          <Image source={require("./Assets/lowPolyBackground.png")} style={styles.container}>
            <LinearGradient colors={['#2f97aa', 'rgba(250,250,250,0.4)']} style={styles.container}>
              <View>
                <View style={styles.innerContainer}>
                  <Animated.Image
                    style={[styles.daliImage, {transform: slidingAnimationStyle}]}
                    source={require('./Assets/DALI_whiteLogo.png')}/>
                  {this.state.animateDone ?
                    <Animated.View style={{opacity: this.state.fadeAnim}}>
                      <TouchableHighlight
                        style={[styles.buttonShadow, styles.button]}
                        onPress={this.signIn.bind(this)}>
                        <View style={styles.button}>
                          <Image source={require('./Assets/googleG.png')} style={styles.googleG}/>
                          <Text style={styles.googleText}>SIGN IN WITH GOOGLE</Text>
                        </View>
                      </TouchableHighlight>
                    </Animated.View> : <View style={{height: 48}}/>}
                <View style={{height: 70}}/>
                </View>
              </View>
            </LinearGradient>
          </Image>
        </View>
    )
  }

  signIn() {
    GoogleSignin.signIn()
    .then((user) => {
      if (user.email.includes('@dali.dartmouth.edu')) {
        // this.props.onLogin(user);
        GoogleSignin.hasPlayServices({ autoResolve: true }).then(() => {
          this.props.onLogin(user);
        })
        .catch((err) => {
          console.log("Play services error", err.code, err.message);
        })
      }else{
        this.invalidAccount();
      }
    })
    .catch((err) => {
      console.log(err);
      setTimeout(() => {
        Alert.alert('Failed to login!', err.message);
      }, 600);
    })
    .done();
  }

  invalidAccount() {
    console.log("Invalid account");
    setTimeout(() => {
      Alert.alert('Invalid Account', 'You must use a DALI lab account!');
    }, 600);
    GoogleSignin.signOut();
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
		justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  innerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  googleG: {
    width: 26,
    resizeMode: 'contain',
    height: 26
  },
  googleText: {
    backgroundColor: 'rgba(0,0,0,0)',
    color: "rgba(174, 174, 174, 1.0)",
    fontFamily: "Avenir Next",
    fontWeight: "600",
    marginLeft: 10
  },
  button: {
    width: 235,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    flexDirection: 'row',
  },
  buttonShadow: {
    shadowOffset: {width: 0, height: 2},
    shadowColor: "gray",
    shadowOpacity: 0.4
  },
  daliImage: {
    width: 240,
    resizeMode: 'contain',
    height: 100,
    marginBottom: 30
  }
});

module.exports = Login;
