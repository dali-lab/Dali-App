import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  Button,
  ListView,
  Image,
  Alert
} from 'react-native';
import EventEmitter from 'EventEmitter';

const ServerCommunicator = require('../ServerCommunicator').default;
const StorageController = require('../StorageController').default;

const eventEmitter = new EventEmitter();

class VoteSelection extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: `${navigation.state.params.event.name}: Vote`,
    headerRight: <Button
      title="Done"
      onPress={() => eventEmitter.emit('voteSelectionNextButtonPressed')}
    />
  });

  constructor(props) {
    super(props);
    // The list view dataSource
    const dataSource = new ListView.DataSource({
      rowHasChanged: (prev, next) => {
        const dirty = prev.dirty === null ? true : prev.dirty;
        prev.dirty = false;
        return prev !== next || dirty;
      },
    });
    eventEmitter.addListener('voteSelectionNextButtonPressed', this.nextPressed.bind(this));
    const { event } = props.navigation.state.params;
    this.selected = [];

    this.state = {
      event,
      options: [],
      dataSource,
      numSelected: 0
    };
    this.visible = true;
    this.loadOptions(event);
  }

  loadOptions(event) {
    ServerCommunicator.current.getOptionsForVotingEvent(event).then((options) => {
      options.forEach((option) => {
        option.selected = false;
        option.dirty = false;
        option.action = () => {
          option.dirty = true;
          option.selected = !option.selected;
          if (option.selected) {
            this.selected.push(option);
          } else {
            this.selected = this.selected.filter(op => op.id !== option.id);
          }

          if (this.state.numSelected >= this.state.event.votingConfig.numSelected) {
            this.state.options.forEach((option) => {
              option.dirty = true;
            });
          }

          const numSelected = this.state.numSelected + (option.selected ? 1 : -1);
          if (numSelected >= this.state.event.votingConfig.numSelected) {
            this.state.options.forEach((option) => {
              option.dirty = true;
            });
          }

          if (this.visible) {
            this.setState({
              numSelected,
              dataSource: this.state.dataSource.cloneWithRows(this.state.options)
            });
          }
        };
      });

      options = options.sort((option1, option2) => {
        if (option1.name === option2.name) {
          return 0;
        }

        return option1.name > option2.name ? 1 : -1;
      });

      if (this.visible) {
        this.setState({
          options,
          dataSource: this.state.dataSource.cloneWithRows(options)
        });
      }
    });
  }

  nextPressed() {
    // Deal with stuff
    console.log('nextPressed');
    if (this.state.numSelected !== this.state.event.votingConfig.numSelected) {
      Alert.alert(`Select the ${this.state.event.votingConfig.numSelected} options you wish to vote for to continue`);
      return;
    }

    ServerCommunicator.current.submitVotes(this.selected, this.state.event)
      .then(() => StorageController.setVoteDone(this.state.event))
      .then(() => {
        this.props.navigation.goBack();
        this.props.navigation.navigate('VoteWait', { event: this.state.event });
      }).catch((error) => {
        Alert.alert('Encountered an error!');
        console.error(error);
      });
  }

  renderRow(option) {
    let index = -1;
    this.selected.forEach((opt, i) => {
      if (opt.id === option.id) {
        index = i;
      }
    });
    const postfixes = ['st', 'nd', 'rd'];

    return (
      <TouchableHighlight
        underlayColor="rgb(112, 187, 173)"
        onPress={this.state.numSelected < this.state.event.votingConfig.numSelected || option.selected ? () => {
        option.action();
      } : null}
      >
        <View style={styles.row}>
          <View style={styles.rowInnerContainer}>
            <Text style={styles.rowText}>{option.name}</Text>
            {option.selected && !this.state.event.votingConfig.ordered ? <Image source={require('../Assets/checkmark.png')} style={styles.rowSelectionImage} /> : null}
          </View>
          {
            this.state.event.votingConfig.ordered && option.selected ?
              <Text style={styles.orderText}>{index < 3 ? `${index + 1}${postfixes[index]} choice` : `${index + 1}th choice`}</Text>
              : null
          }
        </View>
      </TouchableHighlight>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.headerView}>
          <Text style={styles.headerText}>{this.state.event === null ? 'Loading...' : this.state.event.description}</Text>
        </View>
        <Text style={styles.headerText}>Choose {this.state.event.votingConfig.numSelected} of the following...</Text>
        <View style={styles.headerSeperator} />
        <ListView
          style={styles.listView}
          dataSource={this.state.dataSource}
          renderRow={this.renderRow.bind(this)}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(238, 238, 238)'
  },
  headerView: {
    padding: 10,
    backgroundColor: 'rgb(238, 238, 238)'
  },
  headerText: {
    fontFamily: 'Avenir Next',
  },
  row: {
    backgroundColor: 'white',
    padding: 10
  },
  rowInnerContainer: {
    flexDirection: 'row',
    flex: 1
  },
  rowText: {
    fontSize: 20,
    padding: 10,
    flex: 1
  },
  orderText: {
    marginLeft: 10,
    color: 'rgb(153, 153, 153)'
  },
  rowSelectionImage: {
    height: 20,
    width: 20,
    marginRight: 15,
    alignSelf: 'center'
  },
  listView: {
    flex:1,
    backgroundColor: 'rgb(238, 238, 238)'
  },
  seperator: {
    height: 1,
    marginLeft: 10,
    backgroundColor: 'rgb(177, 177, 177)',
  },
  headerSeperator: {
    height: 1,
    backgroundColor: 'rgb(186, 186, 186)',
  }
});

module.exports = VoteSelection;
