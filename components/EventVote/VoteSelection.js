import React, { Component } from 'react';
import {
   AppRegistry,
   StyleSheet,
   Text,
   View,
   TouchableHighlight,
   ListView,
   Image,
   Alert,
   Dimensions,
} from 'react-native';
let ServerCommunicator = require('../ServerCommunicator').default;

const window = Dimensions.get('window')

class VoteSelection extends Component {

   constructor(props) {
      super(props)
      // The list view dataSource
      const dataSource = new ListView.DataSource({
         rowHasChanged: (prev, next) => {
            let dirty = prev.dirty == null ? true : prev.dirty;
            prev.dirty = false;
            return prev !== next || dirty;
         },
      });

      this.state = {
         eventData: null,
         options: [],
         dataSource: dataSource,
         numSelected: 0
      }

      ServerCommunicator.current.getEventNow().then((event) => {
         if (event == null) return;

         event.options.forEach((option) => {
            option.selected = false
            option.dirty = false
            option.action = () => {
               option.dirty = true;
               option.selected = !option.selected;

               if (this.state.numSelected >= 3) {
                  this.state.options.forEach((option) => {
                     option.dirty = true;
                  });
               }

               var numSelected = this.state.numSelected + (option.selected ? 1 : -1)
               if (numSelected >= 3) {
                  this.state.options.forEach((option) => {
                     option.dirty = true;
                  });
               }

               this.setState({
                  numSelected: numSelected,
                  dataSource: this.state.dataSource.cloneWithRows(this.state.options)
               });
            }
         });

         event.options = event.options.sort((option1, option2) => {
            if (option1.name == option2.name) {
               return 0;
            }

            return option1.name > option2.name ? 1 : -1
         });

         this.setState({
            eventData: event,
            options: event.options,
            dataSource: this.state.dataSource.cloneWithRows(event.options)
         });
      }).catch((error) => {
         return;
      });
   }

   nextPressed=(navigator) => {
      // Deal with stuff
      if (this.state.numSelected != 3) {
         Alert.alert("Select the top 3 to continue");
         return;
      }

      var selected = this.state.options.filter((option) => {
         return option.selected;
      });

      navigator.push({name: "VoteOrder", selectedOptions: selected});
   }

   renderRow(option) {

      return (
         <TouchableHighlight
         underlayColor='rgb(112, 187, 173)'
         onPress={this.state.numSelected < 3 || option.selected ? () => {
            option.action();
         } : null}>
         <View style={styles.row}>
         <View style={styles.rowInnerContainer}>
         <Text style={styles.rowText}>{option.name}</Text>
         {option.selected ? <Image source={require("../Assets/checkmark.png")} style={styles.rowSelectionImage}/> : null}
         </View>
         <View style={styles.seperator}/>
         </View>
         </TouchableHighlight>
      );
   }

   render() {
      return (
         <View style={styles.container}>
         <View style={styles.headerView}>
         <Text style={styles.headerText}>{this.state.eventData == null ? "Loading..." : this.state.eventData.description}</Text>
         </View>
         <Text style={styles.headerText}>Choose 3 of the following...</Text>
         <View style={styles.headerSeperator}></View>
         <ListView
         style={styles.listView}
         dataSource={this.state.dataSource}
         renderRow={this.renderRow.bind(this)}/>
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
      fontFamily: "Avenir Next",
   },
   row: {
      marginLeft: 10,
   },
   rowInnerContainer: {
      flexDirection: "row",
      flex: 1
   },
   rowText: {
      fontSize: 20,
      padding: 10,
      fontFamily: "Avenir Next",
      flex: 1
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
})

module.exports = VoteSelection
