import React, { Component } from 'react';
import {
   AppRegistry,
   StyleSheet,
   Text,
   View,
   TouchableHighlight,
   ListView,
   Image,
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
      }
   }

   donePressed(navigator) {
      navigator.push({name: 'VoteResults'});
   }

   renderRow(data) {
      console.log("Rendering: ", data);
      return (
         <TouchableHighlight
         underlayColor={'#eee'}
         delayLongPress={20}
         style={{padding: 25, backgroundColor: '#F8F8F8', borderBottomWidth:1, borderColor: '#eee'}}
         {...this.props.sortHandlers} >
         <Text>{data.name}</Text>
         </TouchableHighlight>
      );
   }

   render() {
      return (
         <View style={styles.container}>
         <Text style={styles.headerText}>Order your votes by dragging</Text>
         <View style={styles.headerSeperator}></View>
         <SortableListView
         style={{flex: 1}}
         data={this.state.selectedOptions}
         order={this.state.order}
         onRowMoved={e => {
            var order = this.state.order;
            order.splice(e.to, 0, order.splice(e.from, 1)[0]);
            console.log(order);
            this.setState({
               order: order
            });
         }}
         onMoveStart={ () => console.log('on move start') }
         onMoveEnd={ () => {
            console.log('on move end');
            this.forceUpdate();
         }}
         renderRow={ this.renderRow.bind(this) }
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
      fontFamily: "Avenir Next",
   },
   headerSeperator: {
      height: 1,
      backgroundColor: 'rgb(186, 186, 186)',
   },
});

module.exports = VoteOrder
