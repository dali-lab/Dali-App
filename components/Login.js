/**
Login.js
A component and controller for the Login interface

AUTHOR: John Kotz
*/


import React, { Component } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {
  StyleSheet,
  Text,
  Platform,
  View,
  Image,
  TouchableHighlight,
  Animated,
  Easing,
  Alert,
  StatusBar
} from 'react-native';
import { GoogleSignin } from 'react-native-google-signin';

const ServerCommunicator = require('./ServerCommunicator').default;

/**
Login interface Component.
Includes:
- DALI Logo (animates from center to high center)
- Google Signin Button (appears after DALI Logo animation at low center)

PROPS:
- onLogin: Called when login is complete
*/
class Login extends Component {
  propTypes: {
    onLogin: ReactNative.PropTypes.func,
    onSkipLogin: ReactNative.PropTypes.func,
  }

  constructor(props) {
    super(props);

    this.state = {
      // Indicates if I should show the signin button
      animateDone: false,
      // The animated value to start at (aka center)
      slidingAnimationValue: new Animated.ValueXY({ x: 0, y: 75 }),
      // Animated value of the opacity of the signin button
      fadeAnim: new Animated.Value(0)
    };
  }

  componentDidMount() {
    // Define configuration of the animation
    const animationConfig = {
      duration: 1500, // milliseconds
      delay: 1000, // milliseconds
      easing: Easing.inOut(Easing.ease),
    };

    const value = this.state.slidingAnimationValue;
    // Set up the animation
    Animated.timing(value, {
      ...animationConfig, // ES6 spread operator
      toValue: {
        x: 0, // Destination x, y
        y: 0,
      },
    }).start(() => {
      // When it's done...
      this.setState({
        animateDone: true
      });
      // ... start the fade in
      Animated.timing(          // Uses easing functions
        this.state.fadeAnim,    // The value to drive
        { toValue: 1 }            // Configuration
      ).start();
    });

    // Animation techniques borrowed from https://facebook.github.io/react-native/docs/animated.html
  }

  /**
  Opens a signin webview so the user can sign in. After doing so, handles errors and calls onLogin if legit
  */
  signIn() {
    this.setState({
      loggingIn: true
    });
    GoogleSignin.signIn()
      .then((user) => {
        if (user === null || !user.email.includes('@dali.dartmouth.edu')) {
          GoogleSignin.signOut();
          this.setState({
            loggingIn: false
          });
          setTimeout(() => {
            Alert.alert('Not DALI account!', 'To access features specific to DALI members use a DALI email');
          }, 600);
          return;
        }

        function signIn(user) {
          ServerCommunicator.current.signin(user).then(() => {
            this.props.onLogin(user);
          }).catch((error) => {
            if (error.code === 400) {
              ServerCommunicator.current.loadTokenAndUser(user).then(() => {
                this.props.onLogin(user);
              }).catch((error) => {
                GoogleSignin.signOut();
              });
            }
          });
        }

        // For some reason on Android the user needs Google Play for me to access the callendars
        GoogleSignin.hasPlayServices({ autoResolve: true }).then(() => {
          signIn(user);
        })
          .catch((err) => {
            if (Platform.OS === 'ios') {
              signIn(user);
              return;
            }
            // Google Play not enabled!
            console.log('Play services error', err.code, err.message);
            setTimeout(() => {
              Alert.alert('No Google Play', "You don't have Google Play services enabled. You won't be able to use the application if you don't (we need to access the DALI calendars)");
            }, 600);
            GoogleSignin.signOut();
          });
      })
      .catch((err) => {
        if (err.code === -5) {
          return; // Very specific error for when the user cancels login
        }

        console.log(err);
        setTimeout(() => {
          Alert.alert('Failed to login!', err.message);
        }, 600);
      });
  }

  // / Render login view
  render() {
    // Special for x y coordinates
    // Basically gets the transform from where it should be
    const slidingAnimationStyle = this.state
      .slidingAnimationValue
      .getTranslateTransform();

    return (
      <View style={styles.container}>
        {this.state.loggingIn ?
          <StatusBar
            barStyle="dark-content"
          />
          : <StatusBar
            barStyle="light-content"
          />}
        {/* Background image is a low poly */}
        <Image source={require('./Assets/lowPolyBackground.png')} style={styles.container}>
          {/* ... which has a gradient overlay (end slightly transparent so low poly is visible) */}
          <LinearGradient colors={['#2f97aa', 'rgba(250,250,250,0.4)']} style={styles.container}>
            <View>
              <View style={styles.innerContainer}>
                {/* Animated DALI Logo */}
                <Animated.Image
                  style={[styles.daliImage, { transform: slidingAnimationStyle }]}
                  source={require('./Assets/DALI_whiteLogo.png')}
                />

                {/* If the animation is over, show button */}
                {this.state.animateDone ?
                  <Animated.View style={{ opacity: this.state.fadeAnim }}>
                    <TouchableHighlight
                      style={[styles.buttonShadow, styles.button]}
                      onPress={this.signIn.bind(this)}
                    >
                      <View style={styles.button}>
                        <Image source={require('./Assets/googleG.png')} style={styles.googleG} />
                        <Text style={styles.googleText}>SIGN IN WITH GOOGLE</Text>
                      </View>
                    </TouchableHighlight>
                    <TouchableHighlight
                      style={{ alignSelf: 'center', marginTop: 15 }}
                      underlayColor="rgba(0,0,0,0.1)"
                      onPress={() => {
                        GoogleSignin.signOut();
                        this.props.onSkipLogin();
                      }}
                    >
                      <Text style={{ color: 'white' }}>Skip Sign In</Text>
                    </TouchableHighlight>
                  </Animated.View> : <View style={{ height: 80 }} />}
                {/* If we don't want to show it yet, I placehold so the DALI logo isn't incorrectly placed */}
                {/* Offsets the group by a bit so it will look better */}
                <View style={{ height: 70 }} />
              </View>
            </View>
          </LinearGradient>
        </Image>
      </View>
    );
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
    color: 'rgba(174, 174, 174, 1.0)',
    fontFamily: 'Avenir Next',
    fontWeight: '600',
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
    shadowOffset: { width: 0, height: 2 },
    shadowColor: 'gray',
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
