import React, { Component } from 'react';
import {
	AppRegistry,
	StyleSheet,
	Text,
	View,
	DeviceEventEmitter,
	TouchableHighlight,
	ListView,
} from 'react-native';
import codePush from "react-native-code-push";
let BeaconController = require('./BeaconController');


class Main extends Component {
  constructor(props) {
		super(props);
		var dataSource = new ListView.DataSource({
			rowHasChanged: (r1, r2) => true,
			sectionHeaderHasChanged: (s1, s2) => s1 !== s2
		});

		this.state = {
			inDALI: null,
			beacons: null,
			beaconController: beaconController,
			dataSource: dataSource
		};
	}
  update() {
    codePush.sync({
      updateDialog: true,
      installMode: codePush.InstallMode.IMMEDIATE
    });
  }

  renderRow(beacon, section, row) {
    return (
      <View>
        <Text style={styles.detail}>
          Major: {beacon.major} Minor: {beacon.minor}{"\n"}
          RSSI: {beacon.rssi}{"\n"}
          Proximity: {beacon.proximity}{"\n"}
          Accuracy: {beacon.accuracy}
        </Text>
      </View>
    );
  }

  render() {
		let inRange = this.state.beacons != null && this.state.beacons.length;
		var beaconNumText = null;

		if (inRange) {
			beaconNumText = <Text style={styles.instructions}>
				In fact, there {this.state.beacons.length > 1 ? "are" : "is"} {this.state.beacons.length} beacon{this.state.beacons.length > 1 ? "s" : ""} nearby
			</Text>
		}


		return (
			<View style={styles.container}>
				<View style={styles.textContainer}>
					<Text>{this.state.inDALI != null ? (this.state.inDALI ? "In DALI" : "Not in DALI") : "Loading..."}</Text>

					<Text style={styles.welcome}>
						{inRange > 0 ? "There is a beacon nearby!" : "There are no beacons :("}
					</Text>
					{beaconNumText}
				</View>
				<View style={styles.internalView}>
					<ListView
						dataSource = {this.state.dataSource}
						automaticallyAdjustContentInsets = {false}
						renderRow = {this.renderRow}/>
				</View>
				<View style={styles.bottomBar}>
					<TouchableHighlight style={styles.updateButton} onPress={this.update}>
						<Text style={styles.updateButtonText}>Update</Text>
					</TouchableHighlight>
				</View>
			</View>
		);
	}
}


const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F5FCFF',
	},
	textContainer: {
		paddingTop: 30,
		justifyContent: 'center',
		alignItems: 'center',
	},
	internalView: {
		flex: 1,
	},
	welcome: {
		fontSize: 20,
		textAlign: 'center',
		margin: 10,
	},
	instructions: {
		textAlign: 'center',
		color: '#333333',
		marginBottom: 5,
	},
	detail: {
		textAlign: 'center',
		color: '#333333',
		marginBottom: 5,
		marginTop: 15,
	},
	bottomBar: {
		backgroundColor: '#adadad',
		height: 50,
		marginBottom: 0,
		marginLeft: 0,
		marginRight: 0,
		alignSelf: "stretch",
		alignItems: "center",
		padding: 15
	},
	updateButton: {
		alignSelf: "stretch",
	},
	updateButtonText: {
		textAlign: "center",
		color: "#0087ff"
	}
});

module.exports = Main
