import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ListView,
  Image,
  Dimensions
} from 'react-native';

const env = require('../Environment');
const ApiUtils = require('../ApiUtils').default;
const ribbonImage = require('../Assets/ribbon.png');

class VoteResults extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: `Voting Results: ${navigation.state.params.event.name}`,
  });

  constructor(props) {
    super(props);

    const dataSource = new ListView.DataSource({
      rowHasChanged: (prev, next) => {
        const dirty = prev.dirty === null ? true : prev.dirty;
        prev.dirty = false;
        return prev !== next || dirty;
      },
      sectionHeaderHasChanged: (prev, next) => prev !== next
    });
    const { event } = props.navigation.state.params;

    this.state = {
      event,
      dataSource,
    };

    this.loadResults(event);
  }

  loadResults(event) {
    fetch(`${env.serverURL}/api/voting/public/${event.id}/results`)
      .then(ApiUtils.checkStatus)
      .then(responseJson => responseJson.json())
      .then((response) => {
        const awards = [];
        response.forEach((option) => {
          option.awards.forEach((award) => {
            awards.push({ award, option });
          });
        });
        awards.sort((result1, result2) => {
          if (result1.award > result2.award) {
            return 1;
          } else if (result1.award < result2.award) {
            return -1;
          } else {
            return 0;
          }
        });
        const awardsObject = {};
        awards.forEach(({ award, option }, i) => {
          awardsObject[i] = { thing: { award, option } };
        });

        this.setState({
          dataSource: this.state.dataSource.cloneWithRowsAndSections(awardsObject),
          results: awards
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  processResults(results) {
    results.forEach((result) => {
      result.dirty = true;
    });

    results.sort((result1, result2) => result1.award < result2.award);
    return results;
  }

  renderRow(award) {
    console.log('badmitten', award);
    return (
      <View>
        <View style={styles.row}>
          <View style={styles.awardRow}>
            <Image style={styles.ribbonImage} source={ribbonImage} />
            <Text style={styles.rowText}>{award.award}</Text>
          </View>
          <View style={styles.separator} />
          <Text style={styles.awardText}>{award.option.name}</Text>
        </View>
      </View>
    );
  }

  renderSectionHeader() {
    return <View style={{ height: 20, backgroundColor: 'rgba(255, 255, 255, 0)' }} />;
  }

  render() {
    return (
      <View style={styles.container}>
        <ListView
          style={styles.listView}
          renderSectionHeader={this.renderSectionHeader.bind(this)}
          renderRow={this.renderRow.bind(this)}
          dataSource={this.state.dataSource}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    backgroundColor : 'white',
    justifyContent : 'center',
    paddingLeft: 15
  },
  separator: {
    height: 1,
    marginLeft: 15,
    backgroundColor: 'rgb(207, 207, 207)'
  },
  rowText: {
    fontWeight: '400',
    fontSize: 30,
    color: '#58AADA',
    paddingLeft: 10,
  },
  awardText: {
    fontSize: 22,
    color: '#F27D00',
    paddingBottom: 3,
    paddingTop: 5,
  },
  awardRow: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row'
  },
  ribbonImage: {
    height: 50,
    width: 40,
    resizeMode: 'contain'
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
