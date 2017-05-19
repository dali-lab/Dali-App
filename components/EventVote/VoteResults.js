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

class VoteResults extends Component {
  propTypes: {
    navigator: React.PropTypes.Object.isRequired
  }

  constructor(props) {
    super(props);

    const dataSource= new ListView.DataSource({
      rowHasChanged: (prev, next) => {
        let dirty = prev.dirty == null ? true : prev.dirty;
        prev.dirty = false;
        return prev!== next || dirty;
      },
    });

    this.state = {
      dataSource : dataSource
    };

    this.reloadData();
  }

  reloadData() {
    ServerCommunicator.current.getVotingResults().then((results) => {
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(results)
      })
    }).catch((error) => {
      console.log(error);
    });
  }

  renderRow(option) {
    return (
      <View>
        <View style={styles.row}>
          <Text style={styles.rowText}>{option.name}</Text>
          <Text style={styles.awardText}>{option.award}</Text>
        </View>
        <View style={styles.separator}/>
      </View>
    )
  }

  render() {
    return (
      <View style={styles.container}>
        <ListView style={styles.listView} renderRow = {this.renderRow.bind(this)} dataSource={this.state.dataSource}/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    backgroundColor : 'white',
    justifyContent : 'center',
    flexDirection : 'row',
    padding: 15
  },
  separator: {
    height: 1,
    marginLeft: 15,
    backgroundColor: 'rgb(177,177,177)'
  },
  rowText: {
     flex: 1,
     fontFamily: 'Avenir Next',
     fontSize: 18,
     textAlign: 'left'
  },
  awardText: {
    color: 'gray',
    alignSelf: 'center',
    marginLeft: 20
  },
  container: {
    flex:1,
    backgroundColor: 'rgb(238,238,238)',
    alignItems: 'center'
  },
  listView: {
    marginTop: 10,
    flex:1,
    width: Dimensions.get('window').width
  }
});

module.exports = VoteResults;
