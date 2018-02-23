import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  ListView,
  Button
} from 'react-native';
import dateFormat from 'dateformat';
import EventEmitter from 'EventEmitter';

const ServerCommunicator = require('../ServerCommunicator').default;
const BeaconController = require('../BeaconController').default;
const StorageController = require('../StorageController').default;

const eventEmitter = new EventEmitter();

class VoteMain extends Component {
  static navigationOptions = ({ navigation }) => ({
    headerRight: <Button title="Done" onPress={() => eventEmitter.emit('doneButtonPressed')} />
  });

  constructor(props) {
    super(props);

    const dataSource = new ListView.DataSource({
      rowHasChanged: (prev, next) => {
        const dirty = prev.dirty === null ? true : prev.dirty;
        prev.dirty = false;
        return prev !== next || dirty;
      },
      sectionHeaderHasChanged: (prevSectionData, nextSectionData) => true
    });

    eventEmitter.addListener('doneButtonPressed', this.doneButtonPressed.bind(this));

    this.past = [];
    this.nowVoting = [];

    this.state = {
      dataSource: dataSource.cloneWithRowsAndSections({
        past: this.past,
        nowVoting: this.nowVoting
      })
    };
    BeaconController.current.confirmVoting();

    BeaconController.current.addVotingRegionListener(() => {
      this.updateCurrentEvent();
    });

    this.updateCurrentEvent();
    this.updatePastEvents();
  }

  doneButtonPressed() {
    this.props.screenProps.dismiss();
  }

  updatePastEvents() {
    ServerCommunicator.current.getPastEvents().then((events) => {
      console.log(events);
      this.pastEvents = events || [];
      console.log(this.pastEvents);
      this.pastEvents.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      this.setState({
        dataSource: this.state.dataSource.cloneWithRowsAndSections({ nowVoting: this.nowVoting,  past: this.pastEvents })
      });
    }).catch((error) => {
    });
  }

  updateCurrentEvent() {
    ServerCommunicator.current.getEventsNow().then((events) => {
      console.log('currentEvents', events);
      this.nowVoting = BeaconController.current.inVotingEvent ? events : [];

      this.setState({
        dataSource: this.state.dataSource.cloneWithRowsAndSections({ nowVoting: this.nowVoting, past: this.pastEvents })
      });
    }).catch((error) => {
      console.log('currentEvents', 'Failed to get!');
      this.setState({
        dataSource: this.state.dataSource.cloneWithRowsAndSections({ nowVoting: this.nowVoting, past: this.pastEvents })
      });
    });
  }

  pastEventRowSelected(rowData, sectionID, rowID) {
    this.props.navigation.navigate('Results', { event: rowData });
  }

  currentEventRowSelected(rowData, sectionID, rowID) {
    StorageController.getVoteDone(rowData).then((result) => {
      if (!result) {
        this.props.navigation.navigate('VoteSelection', { event: rowData });
      } else {
        this.props.navigation.navigate('VoteWait', { event: rowData });
      }
    });
  }

  renderRow(rowData, sectionID, rowID, highlightRow) {
    console.log('rowData', rowData);
    const months = [
      'January', 'February', 'March',
      'April', 'May', 'June', 'July',
      'August', 'September', 'October',
      'November', 'December'
    ];

    const date = new Date(rowData.startTime);
    const endDate = new Date(rowData.endTime);
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    return (
      <TouchableHighlight
        style={sectionID === 'nowVoting' ? styles.currentEventRow : styles.pastEventRow}
        onPress={() => {
          if (sectionID === 'nowVoting') {
            this.currentEventRowSelected(rowData, sectionID, rowID);
          } else {
            this.pastEventRowSelected(rowData, sectionID, rowID);
          }
        }}
        underlayColor="rgba(240, 240, 240, 0.9)"
      >
        <View>
          <Text style={styles.rowTitle}>{rowData.name}</Text>
          <Text style={styles.rowDescription}>{rowData.description}</Text>
          <Text style={styles.rowTime}>{months[monthIndex]} {day}, {year}{sectionID === 'nowVoting' ? ` ${dateFormat(date, 'h:MM TT')} - ${dateFormat(endDate, 'h:MM TT')}` : ''}</Text>
        </View>
      </TouchableHighlight>
    );
  }

  renderSectionHeader(sectionData, sectionID) {
    if (sectionData.length === 0) {
      return null;
    }

    if (sectionID === 'nowVoting') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>NOW VOTING</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>PAST EVENTS</Text>
        </View>
      );
    }
  }

  render() {
    return (
      <ListView
        style={styles.tableView}
        dataSource={this.state.dataSource}
        enableEmptySections={true}
        renderRow={this.renderRow.bind(this)}
        renderSectionHeader={this.renderSectionHeader.bind(this)}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBarTitleText: {
    color: 'white',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 15
  },
  navBarDoneText: {
    color: 'rgb(89, 229, 205)',
    fontFamily: 'Avenir Next',
    fontSize: 18,
    fontWeight: '500',
  },
  navBarCancelText: {
    color: 'rgb(89, 229, 205)',
    fontFamily: 'Avenir Next',
    fontSize: 18,
    fontWeight: '300',
  },
  navBarDoneButton: {
    marginTop: 15,
    marginRight: 10,
  },
  navBarCancelButton: {
    marginTop: 15,
    marginLeft: 10,
  },
  navBar: {
    justifyContent: 'center',
    paddingTop: 64,
    backgroundColor: 'rgb(232, 230, 230)'
  },
  tableView: {
    backgroundColor: 'rgb(232, 230, 230)',
  },
  sectionHeader: {

  },
  sectionHeaderText: {
    padding: 10,
    color: '#7f7f7f'
  },
  currentEventRow: {
    padding: 10,
    backgroundColor: 'white'
  },
  pastEventRow: {
    backgroundColor: 'white',
    padding: 10
  },
  rowTitle: {
    paddingLeft: 5,
    fontSize: 20,
  },
  rowDescription: {

  },
  rowTime: {
    color: 'gray',
    paddingLeft: 5,
  },
});

module.exports = VoteMain;
