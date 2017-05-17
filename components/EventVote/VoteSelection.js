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
   propTypes: {
      voteComplete: ReactNative.PropTypes.func.isRequired,
   }

   constructor(props) {
      super(props)
      // The list view dataSource
      const dataSource = new ListView.DataSource({
         rowHasChanged: (prev, next) => {
            let dirty = prev.dirty == null ? true : prev.dirty;
            prev.dirty = false;
            return prev !== next || dirty
         },
         sectionHeaderHasChanged: (prev, next) => {
            let dirty = prev.dirty == null ? true : prev.dirty;
            prev.dirty = false;
            return prev !== next || dirty
         },
      });

      this.state = {
         eventData: null,
         options: [],
         currentSection: 0,
         dataSource: dataSource
      }

      ServerCommunicator.current.getEventNow().then((event) => {
         event.options.forEach((option) => {
            option.selected = false
            option.dirty = false
         })

         this.setState({
            eventData: event,
            options: event.options,
            dataSource: dataSource.cloneWithRowsAndSections(this.getData(event.options))
         });
      });
   }

   donePressed() {
      // Deal with stuff
   }

   getData(opts, currSect, newSelected, newSelectedSectionID) {
      var options = this.state.options;
      var currentSection = this.state.currentSection;
      if (opts != null) {
         options = opts;
      }
      if (currSect != null) {
         currentSection = currSect;
      }

      options.forEach((option) => {
         option.action = (sectionID, rowID) => {
            var options = this.state.options;
            options[rowID].dirty = true;
            if (this.state[sectionID + " Selected"] != null) {
               this.state[sectionID + " Selected"].dirty = true;
            }
            let selectingSection = parseInt(sectionID.replace(/[^0-9\.]/g, ''), 10) - 1;
            let newSection = this.state.currentSection == selectingSection ? (this.state.currentSection < 2 ? this.state.currentSection + 1 : -1) : selectingSection
            this.setState({
               options: options,
               currentSection: newSection,
               [sectionID + " Selected"]: this.state[sectionID + " Selected"] != option ? option : null,
               dataSource: this.state.dataSource.cloneWithRowsAndSections(
                  this.getData(options,
                     newSection,
                     this.state[sectionID + " Selected"] != option ? option : null,
                     sectionID
                  )
               )
            });
         }
      })

      const getSelectedForSection = (sectionID) => {
         return (newSelectedSectionID != null && newSelectedSectionID == sectionID ?
            newSelected :
            this.state[sectionID + " Selected"]
         )
      }

      return {
         "1st Choice": currentSection == 0 ? options : [
            getSelectedForSection("1st Choice") == null ? "EMPTY" : getSelectedForSection("1st Choice")
         ],
         "2nd Choice": currentSection == 1 ? options : [
            getSelectedForSection("2nd Choice") == null ? "EMPTY" : getSelectedForSection("2nd Choice")
         ],
         "3rd Choice": currentSection == 2 ? options : [
            getSelectedForSection("3rd Choice") == null ? "EMPTY" : getSelectedForSection("3rd Choice")
         ],
      };
   }

   renderRow(option, sectionID, rowID) {
      if (option == "EMPTY") {
         return (
            <View/>
         );
      }

      var option1 = sectionID == "2nd Choice" ? "1st Choice" : (sectionID == "3rd Choice" ? "1st Choice" : "2nd Choice")
      var option2 = sectionID == "3rd Choice" ? "2nd Choice" : "3rd Choice"
      const selectedInOthers = (option == this.state[option1 + " Selected"] || option == this.state[option2 + " Selected"])

      return (
         <TouchableHighlight
         underlayColor='rgb(112, 187, 173)'
         onPress={!selectedInOthers ? () => option.action(sectionID, rowID) : null}>
         <View style={[styles.row, (selectedInOthers ? styles.rowDisabled : null)]}>
         <View style={styles.rowInnerContainer}>
         <Text style={styles.rowText}>{option.name}</Text>
         {option == this.state[sectionID + " Selected"]? <Image source={require("../Assets/checkmark.png")} style={styles.rowSelectionImage}/> : null}
         </View>
         <View style={styles.seperator}/>
         </View>
         </TouchableHighlight>
      );
   }

   /**
   Gets a view of a section header
   */
   renderSectionHeader(data, sectionName) {
      return (
         <TouchableHighlight
         style={styles.sectionHeader}
         underlayColor='rgb(185, 185, 185)'
         onPress={() => {
            let section = parseInt(sectionName.replace(/[^0-9\.]/g, ''), 10) - 1;
            let newSection = section == this.state.currentSection ? -1 : section
            this.setState({
               currentSection: newSection,
               dataSource: this.state.dataSource.cloneWithRowsAndSections(this.getData(
                  this.state.options,
                  newSection
               ))
            })
         }}>
         <Text style={styles.sectionHeaderText}>{sectionName.toUpperCase()}</Text>
         </TouchableHighlight>
      )
   }

   render() {
      return (
         <View style={styles.container}>
         <View style={styles.headerView}>
         <Text style={styles.headerText}>{this.state.eventData == null ? "Loading..." : this.state.eventData.description}</Text>
         </View>
         <View style={styles.headerSeperator}></View>
         <ListView
         style={styles.listView}
         dataSource={this.state.dataSource}
         renderSectionHeader={this.renderSectionHeader.bind(this)}
         renderRow={this.renderRow.bind(this)}/>
         </View>
      );
   }
}

const styles = StyleSheet.create({
   container: {
      flex: 1
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
   rowDisabled: {
      backgroundColor: 'grey'
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
