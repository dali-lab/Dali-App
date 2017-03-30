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
  Switch
} from 'react-native';
const StorageController = require('./StorageController').default;
import codePush from "react-native-code-push";
import {GoogleSignin} from 'react-native-google-signin'


class Settings extends Component {
  propTypes: {
    onLogout: ReactNative.PropTypes.func,
    dismiss: ReactNative.PropTypes.func.isRequired,
    user: ReactNative.PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)

    const dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2
    });



    this.state = {
      dataSource: dataSource.cloneWithRowsAndSections(this.getData(props)),
      checkInNotif: true,
      labAccessNotif: true
    }

    StorageController.getLabAccessPreference().then((value) => {
      if (value == null) {
        this.setState({
          labAccessNotif: true
        })
        StorageController.saveLabAccessPreference(true)
        return
      }

      this.setState({
        labAccessNotif: value
      })
    });
    StorageController.getCheckinNotifPreference().then((value) => {
      if (value == null) {
        this.setState({
          checkInNotif: true
        })
        StorageController.saveCheckInNotifPreference(true)
        return
      }

      this.setState({
        checkInNotif: value
      })
    })
  }

	getData() {
		var notificationsRows = [
			{
				title: "Event Check-in",
				detail: "Allow notifications when you are checked in to a DALI event.",
				switchChanged: (value) => {
					this.setState({
						checkInNotif: value,
						dataSource: this.state.dataSource.cloneWithRowsAndSections(this.getData(this.props)),
					})
					StorageController.saveCheckInNotifPreference(value);
				},
				stateName: "checkInNotif"
			},{
				title: "Lab Access",
				detail: "Notify me when I enter or exit the lab",
				switchChanged: (value) => {
					this.setState({
						labAccessNotif: value,
						dataSource: this.state.dataSource.cloneWithRowsAndSections(this.getData(this.props)),
					})

					StorageController.saveLabAccessPreference(value);
				},
				stateName: "labAccessNotif"
			}
		]

		var signOutRow = {
			title: "Sign Out",
			action: this.props.onLogout,
			image: GoogleSignin.currentUser().photo
		}
		var update = {
			title: "Update",
			action: () => {
				codePush.sync({
					updateDialog: true,
					installMode: codePush.InstallMode.IMMEDIATE
				});
			}
		}

		return { user: [signOutRow, update], notifications: notificationsRows}
	}

  renderRow(data, section, row) {
    if (section == 'user') {
      return (
        <TouchableHighlight onPress={data.action}>
          <View>
            <View style={styles.userRow}>
							<Image source={{uri: data.image}} style={styles.userProfileImage}/>
              <Text style={styles.userRowTitle}>{data.title}</Text>
              <Image source={require('./Assets/disclosureIndicator.png')} style={styles.disclosureIndicator}/>
            </View>
            <View style={styles.seperator}/>
          </View>
        </TouchableHighlight>
      )
    }

    return (
      <View>
      <View style={styles.notificationRow}>
        <View style={styles.notificationRowTextContainer}>
          <Text style={styles.notificationRowTitle}>{data.title}</Text>
          <Text style={styles.notificationRowDetail}>{data.detail}</Text>
        </View>
        <Switch
          value={this.state[data.stateName]}
          onValueChange={data.switchChanged}
          style={styles.notificationRowSwitch}/>
      </View>
      <View style={row == 0 ? styles.seperatorSmall : styles.seperator}/>
      </View>
    )
  }

  renderSectionHeader(data, sectionName) {
    if (sectionName == "user") {
      return <View/>
    }

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>NOTIFICATIONS</Text>
      </View>
    )
  }

  render() {
    return (
      <Navigator
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
                   { return (<Text style={styles.navBarTitleText}>Settings</Text>); },
               }}
               style={{backgroundColor: 'rgb(33, 122, 136)'}}
             />
          }
        renderScene={(route, navigator) =>
          <ListView
            style={styles.listView}
            dataSource={this.state.dataSource}
            renderSectionHeader={this.renderSectionHeader.bind(this)}
            renderRow={this.renderRow.bind(this)}/>
        }
        style={{paddingTop: 65}}
      />
    )
  }
}

const styles = StyleSheet.create({
	userProfileImage: {
		width: 25,
		height: 25,
    alignSelf: 'flex-start',
    resizeMode: 'contain',
		marginRight: 8,
		borderRadius: 70
	},
  dismissButton: {
    marginTop: 30
  },
  navBarTitleText: {
    color: 'white',
    fontFamily: 'Avenir Next',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 10
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
    flex: 1,
    backgroundColor: 'rgb(238, 238, 238)'
  },
  seperator: {
    height: 1,
    backgroundColor: 'rgb(200, 200, 200)',
    flex: 1
  },
  seperatorSmall: {
    height: 1,
    marginLeft: 20,
    backgroundColor: 'rgb(200, 200, 200)',
    flex: 1
  },
  sectionHeader: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    backgroundColor: 'rgb(238, 238, 238)'
  },
  sectionHeaderText: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    marginLeft: 10,
    fontSize: 10,
    fontFamily: 'Avenir Next',
    fontWeight: '600',
    color: 'grey'
  },
  notificationRow: {
    padding: 10,
		paddingBottom: 18,
    backgroundColor: 'white',
    paddingLeft: 20,
    flexDirection: 'row',
		flex: 1
  },
  notificationRowTextContainer: {
    flex: 1
  },
  notificationRowTitle: {
    fontSize: 18,
    fontFamily: 'Avenir Next',
    marginBottom: 11
  },
  notificationRowDetail: {
    fontSize: 13,
    fontFamily: 'Avenir Next',
    fontWeight: '400',
		marginRight: 53,
    color: 'grey'
  },
  notificationRowSwitch: {
    marginRight: 10
  },
  userRow: {
    padding: 10,
    backgroundColor: 'white',
    paddingLeft: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  disclosureIndicator: {
    alignSelf: 'flex-end',
    resizeMode: 'contain',
    height: 15,
    width: 15,
    marginBottom: 4,
  },
  userRowTitle: {
    fontSize: 16,
		paddingLeft: 2,
    flex: 1,
    fontFamily: 'Avenir Next',
  }
});

module.exports = Settings
