import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  Navigator,
  ListView,
  Image,
} from 'react-native';

const ServerCommunicator = require('../ServerCommunicator').default;
const BeaconController = require('../BeaconController').default;
const VoteWait = require('./VoteWait');

class VoteTopLevel extends Component {
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

    this.state = {
      currentEvent: null,
      pastEvents: [],
      dataSource: dataSource.cloneWithRowsAndSections({
        past: [],
        nowVoting: []
      })
    };

    BeaconController.current.addVotingRegionListener(() => {
      this.updateCurrentEvent();
    });

    this.updateCurrentEvent();
    this.updatePastEvents();
  }

  updatePastEvents() {
    ServerCommunicator.current.getPastEvents().then((events) => {
      console.log(events);
      this.setState({
        pastEvents: events,
        dataSource: this.state.dataSource.cloneWithRowsAndSections({ pastEvents: events || [] })
      });
    }).catch((error) => {
    });
  }

  updateCurrentEvent() {
    ServerCommunicator.current.getEventNow().then((event) => {
      this.setState({ currentEvent: event });

      this.setState({
        currentEvent: BeaconController.current.currentLocation() === 'voting' ? event : null,
        dataSource: this.state.dataSource.cloneWithRowsAndSections({ nowVoting: BeaconController.current.currentLocation() === 'voting' ? [event] : [] })
      });
    }).catch((error) => {
      this.setState({
        currentEvent: null,
        dataSource: this.state.dataSource.cloneWithRowsAndSections({ nowVoting: [] })
      });
    });
  }

  renderRow(rowData, sectionID, rowID, highlightRow) {
    console.log(rowData);
    return (
      <View style={{ height: 20, backgroundColor: 'red' }} />
    );
  }

  renderSectionHeader(sectionData, sectionID) {
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

  renderInternal() {
    return (<ListView
      dataSource={this.state.dataSource}
      renderRow={this.renderRow.bind(this)}
      renderSectionHeader={this.renderSectionHeader.bind(this)}
    />);
  }

  render() {
    return (
      <Navigator
        initialRoute={{ name: 'VoteSelection' }}
        navigationBar={
          <Navigator.NavigationBar
            routeMapper={{
              LeftButton: (route, navigator, index, navState) =>
                null,                // else if (route.name === 'VoteOrder') {
              //   return (
              //     <TouchableHighlight
              //       underlayColor="rgba(0,0,0,0)"
              //       style={styles.navBarCancelButton}
              //       onPress={navigator.pop}
              //     >
              //       <Text style={styles.navBarCancelText}>{'Back'}</Text>
              //     </TouchableHighlight>
              //   );
              // } else {
              //   return (
              //     <TouchableHighlight
              //       underlayColor="rgba(0,0,0,0)"
              //       style={styles.navBarCancelButton}
              //       onPress={this.props.dismiss}
              //     >
              //       <Text style={styles.navBarCancelText}>Cancel</Text>
              //     </TouchableHighlight>
              //   );
              // }

              RightButton: (route, navigator, index, navState) => {
                // Done Button

                let text = '';
                let func = () => {};

                if (!this.state.hasVoted && this.state.results === null) {
                  // We are on Voting selection
                  if (route.name === 'VoteSelection') {
                    func = () => this.voteSelection.nextPressed(navigator);
                    text = 'Next';
                  } else {
                    func = this.submitVotes.bind(this);
                    text = 'Done';
                  }
                } else {
                  text = 'Done';
                  func = this.props.dismiss;
                }

                return (
                  <TouchableHighlight
                    underlayColor="rgba(0,0,0,0)"
                    style={styles.navBarDoneButton}
                    onPress={func}
                  >
                    <Text style={styles.navBarDoneText}>{text}</Text>
                  </TouchableHighlight>
                );
              },
              Title: (route, navigator, index, navState) => (<Text style={styles.navBarTitleText}>Voting</Text>)
            }}
            style={{ backgroundColor: 'rgb(33, 122, 136)' }}
          />
        }
        renderScene={(route, navigator) =>
          (<View style={{ flex: 1 }}>
            {this.renderInternal(route, navigator)}
          </View>)
        }
        style={styles.navBar}
      />
    );
  }
}

const styles = StyleSheet.create({
  navBarTitleText: {
    color: 'white',
    fontFamily: 'Avenir Next',
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
    paddingTop: 64
  },
  sectionHeader: {

  },
  sectionHeaderText: {
    padding: 10,
    color: '#7f7f7f'
  }
});

module.exports = VoteTopLevel;
