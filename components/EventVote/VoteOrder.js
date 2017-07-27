import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
} from 'react-native';
import SortableListView from 'react-native-sortable-listview';

class VoteOrder extends Component {
   propTypes: {
      voteComplete: ReactNative.PropTypes.func.isRequired,
      selectedOptions: ReactNative.PropTypes.Object.isRequired,
   }

   constructor(props) {
     super(props);

     this.state = {
       order: Object.keys(this.props.selectedOptions),
       selectedOptions: props.selectedOptions
     };
   }

   renderRow(data, sectionID, rowID) {
     const row = this.state.order.indexOf(rowID);
     const choiceNames = ['1st Choice', '2nd Choice', '3rd Choice'];
     return (
       <TouchableHighlight
         underlayColor={'#eee'}
         delayLongPress={20}
         style={styles.row}
         {...this.props.sortHandlers}
       >
         <View>
           <Text style={styles.orderLabel}>{choiceNames[row]}</Text>
           <Text style={styles.optionNameLabel}>{data.name}</Text>
         </View>
       </TouchableHighlight>
     );
   }

   render() {
     return (
       <View style={styles.container}>
         <Text style={styles.headerText}>Order your votes by dragging</Text>
         <View style={styles.headerSeperator} />
         <SortableListView
           style={styles.tableView}
           data={this.state.selectedOptions}
           order={this.state.order}
           sortRowStyle={styles.sortRow}
           rowHasChanged={() => true}
           onRowMoved={(e) => {
             const order = this.state.order;
             order.splice(e.to, 0, order.splice(e.from, 1)[0]);
             console.log(order);
             this.setState({
               order
             });
             this.forceUpdate();
           }}
           renderRow={this.renderRow.bind(this)}
         />
       </View>
     );
   }
}
// renderRow={ row => this.renderRow(row) } />

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1
  },
  headerText: {
    fontFamily: 'Avenir Next',
  },
  headerSeperator: {
    height: 1,
    backgroundColor: 'rgb(186, 186, 186)',
  },
  tableView: {
    flex: 1
  },
  row: {
    paddingBottom: 20,
    paddingLeft: 10,
    paddingRight: 20,
    backgroundColor:'#F8F8F8',
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  sortRow: {

  },
  orderLabel: {
    color: 'grey',
    fontFamily: 'Avenir Next',
    fontSize: 12,
    marginBottom: 5,
    marginTop: 5,
  },
  optionNameLabel: {
    fontFamily: 'Avenir Next',
    paddingLeft: 10,
    fontSize: 16
  }
});

module.exports = VoteOrder;
