import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ListView,
  Dimensions
} from 'react-native';

class VoteResults extends Component {
   propTypes: {
      navigator: React.PropTypes.Object.isRequired,
      results: React.PropTypes.Object.isRequired,
   }

   constructor(props) {
     super(props);

     const dataSource = new ListView.DataSource({
       rowHasChanged: (prev, next) => {
         const dirty = prev.dirty === null ? true : prev.dirty;
         prev.dirty = false;
         return prev !== next || dirty;
       },
     });

     const results = this.processResults(props.results);
     this.state = {
       dataSource : dataSource.cloneWithRows(results)
     };
   }

   componentWillReceiveProps(nextProps) {
     const results = this.processResults(nextProps.results);

     this.setState({
       dataSource : this.state.dataSource.cloneWithRows(results)
     });
   }

   processResults(results) {
     results.forEach((result) => {
       result.dirty = true;
     });

     results.sort((result1, result2) => result1.name < result2.name);
     return results;
   }

   renderRow(option) {
     return (
       <View>
         <View style={styles.row}>
           <Text style={styles.rowText}>{option.name}</Text>
           <View style={styles.awardContainer}>{
             option.awards.map(award => <Text key={award} style={styles.awardText}>{award}</Text>)
           }</View>
         </View>
         <View style={styles.separator} />
       </View>
     );
   }

   render() {
     return (
       <View style={styles.container}>
         <ListView style={styles.listView} renderRow={this.renderRow.bind(this)} dataSource={this.state.dataSource} />
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
    marginLeft: 20,
    textAlign: 'right',
    paddingBottom: 3,
  },
  awardContainer: {
    marginTop: 3

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
