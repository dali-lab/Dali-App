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

class Settings extends Component {
  propTypes: {
    onLogout: ReactNative.PropTypes.func,
    dismiss: ReactNative.PropTypes.func.isRequired,
    user: ReactNative.PropTypes.object.isRequired,
  }

  render() {
    return (
      <View>
        <TouchableHighlight onPress={this.props.dismiss} style={styles.dismissButton}>
          <Text>
            Dismiss
          </Text>
        </TouchableHighlight>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  dismissButton: {
    marginTop: 30
  }
});

module.exports = Settings
