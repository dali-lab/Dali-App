import React, { Component } from 'react';
import {
	AppRegistry,
	StyleSheet,
	Text,
	View,
	TouchableHighlight,
	ListView,
	Image,
  Navigator,
	Alert
} from 'react-native';
let ServerCommunicator = require('./ServerCommunicator').default;

class PeopleInLab extends Component {
  propTypes: {
    dismiss: ReactNative.PropTypes.func.isRequired,
  }

  constructor(props) {
		super(props)

		const dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2
    });


		this.alerted = false

		this.state = {
			timInDALI: null,
			timInOffice: null,
			peopleInLab: null,
			dataSource: dataSource.cloneWithRowsAndSections({})
		}

		this.getData()
	}

	getData() {
		ServerCommunicator.current.getSharedMembersInLab().then((people) => {
			if (people == null) {
				if (!this.alerted) {
					setTimeout(() => {
						Alert.alert("Failed to connect", "Failed to connect to the server. It may be down. Contact John Kotz", [
							{text: 'OK', onPress: this.props.dismiss}
						], { cancelable: false })
					}, 600);
				}
				this.alerted = true
				return
			}
			
			this.setState({
				peopleInLab: people,
				dataSource: this.state.dataSource.cloneWithRowsAndSections({
					tim: [{inDALI: null, inOffice: null}], others: people
				})
			})
		}).catch((error) => {
			console.error(error);
		})


		ServerCommunicator.current.getTimLocation().then((locations) => {
			if (locations == null) {
				if (!this.alerted) {
					setTimeout(() => {
						Alert.alert("Failed to connect", "Failed to connect to the server. It may be down. Contact John Kotz", [
							{text: 'OK', onPress: this.props.dismiss}
						], { cancelable: false })
					}, 600);
				}
				this.alerted = true
				return
			}

			this.setState({
				timInDALI: locations.inDALI,
				timInOffice: locations.inOffice,
				dataSource: this.state.dataSource.cloneWithRowsAndSections({tim: [locations], others: this.state.peopleInLab == null ? [] : this.state.peopleInLab})
			})
		}).catch((error) => {
			console.log(error);
		})

		setTimeout(() => {
			this.getData()
		}, 10000)
	}

	renderRow(data, section, row) {
		if (section == 'tim') {
			let locKnown = this.state.timInOffice || this.state.timInDALI
			let locationString = "In " + (this.state.timInOffice ? "his office" : (this.state.timInDALI ? "DALI Lab" : ""))

			return (<View style={styles.timRow}>
				<Text style={styles.timNameText}>Tim Tregubov</Text>
				<View style={{flex:1}}/>
				<Text style={styles.timLocationText}>{locKnown ? locationString : "Location Unknown"}</Text>
			</View>)
		}else{
			return (
				<View style={styles.personRow}>
					<Text style={styles.personNameText}>{data.name}</Text>
				</View>
			)
		}
	}

	renderSectionHeader(data, sectionName) {
		if (sectionName == "tim") {
			return (
				<View style={styles.sectionHeader}>
	        <Text style={styles.sectionHeaderText}>STAFF</Text>
	      </View>
			)
		}else if (sectionName == "others") {
			return (
				<View style={styles.sectionHeader}>
	        <Text style={styles.sectionHeaderText}>IN DALI NOW</Text>
	      </View>
			)
		}
	}

	render() {
		return (<Navigator
			navigationBar={
					 <Navigator.NavigationBar
						 routeMapper={{
							 LeftButton: (route, navigator, index, navState) =>
								{ return (null); },
							 RightButton: (route, navigator, index, navState) =>
								 { return (
										<TouchableHighlight
											underlayColor="rgba(0,0,0,0)"
											style={styles.navBarDoneButton}
											onPress={this.props.dismiss}>
											<Text style={styles.navBarDoneText}>Done</Text>
										</TouchableHighlight>
									);},
							 Title: (route, navigator, index, navState) =>
								 { return (<Text style={styles.navBarTitleText}>People In The Lab</Text>); },
						 }}
						 style={{backgroundColor: 'rgb(33, 122, 136)'}}
					 />
				}
			renderScene={(route, navigator) =>
					<ListView
						style={styles.listView}
						dataSource={this.state.dataSource}
						enableEmptySections={true}
						renderSectionHeader={this.renderSectionHeader.bind(this)}
						renderRow={this.renderRow.bind(this)}/>
			}
			style={{paddingTop: 65}}
		/>)
	}
}

const styles = StyleSheet.create({
	navBarTitleText: {
		color: 'white',
		fontFamily: 'Avenir Next',
		fontSize: 18,
		fontWeight: '500',
		marginTop: 15
	},
	navBarDoneText: {
		color: 'rgb(89, 229, 205)',
		fontFamily: 'Avenir Next',
		fontSize: 18,
		fontWeight: '500',
	},
	navBarDoneButton: {
		marginTop: 10,
		marginRight: 10
	},
	listView: {
		backgroundColor: 'rgb(238, 238, 238)',
	},
	sectionHeader: {
		backgroundColor: 'rgb(238, 238, 238)',
		paddingTop: 20
	},
	sectionHeaderText: {
		color: 'grey',
		marginLeft: 10,
		marginBottom: 5,
		fontSize: 12
	},
	timRow: {
		backgroundColor: 'white',
		flexDirection: 'row',
		padding: 15
	},
	timNameText: {
		fontSize: 16
	},
	timLocationText: {
		marginRight: 15,
		fontSize: 14
	},
	personRow: {
		backgroundColor: 'white',
		flexDirection: 'row',
		padding: 15
	},
	personNameText: {
		fontSize: 16
	}
})

module.exports = PeopleInLab
