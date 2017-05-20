import React, { Component } from 'react';
import {
   AppRegistry,
   StyleSheet,
   Text,
   View,
   TouchableHighlight,
   ListView,
   Image,
   Dimensions,
   Modal,
   TextInput,
   Alert,
   ActivityIndicator
} from 'react-native';

let ServerCommunicator = require('./ServerCommunicator').default;

class VotingEventSettings extends Component {
   propTypes: {
      navigator: React.PropTypes.Object.isRequired
   }

   constructor(props) {
      super(props);

      const dataSource = new ListView.DataSource({
         rowHasChanged: (prev, next) => {
            let dirty = prev.dirty == null ? true : prev.dirty;
            prev.dirty = false;
            return prev !== next || dirty;
         },
      });

      this.state = {
         event: undefined,
         dataSource: dataSource,
         showingEditOption: false,
         showCoverModal: false
      };

      this.reloadData();
   }

   reloadData() {
      ServerCommunicator.current.getEventNow().then((event) => {
         if (event != null) {
            event.options.sort((first, second) => {
               if (first.score == second.score) {
                  return 0;
               }

               return first.score > second.score ? -1 : 1;
            });

            for (var i = 0; i < event.options.length; i++) {
               event.options[i].dirty = true;
               if (this.state.event != null) {
                  if (this.state.event.options[i].id == event.options[i].id) {
                     event.options[i].award = this.state.event.options[i].award;
                  }
               }else{
                  event.options[i].dirty = undefined;
               }
            }

            if (this.reloadInterval == null) {
               this.reloadInterval = setInterval(() => {
                  this.reloadData();
               }, 1000 * 5);
            }
         }

         this.setState({
            event: event,
            dataSource: this.state.dataSource.cloneWithRows(event != null ? event.options : [])
         });
      }).catch((error) => {
         if (error.code == 404) {
            this.setState({
               event: null
            });
         }
      });
   }

   componentWillUnmount() {
      clearInterval(this.reloadInterval);
      this.reloadInterval = undefined;
   }

   createPressed() {
      this.props.navigator.push({name:  "Create Voting Event Subsettings"});
      clearInterval(this.reloadInterval);
      this.reloadInterval = undefined;
   }

   editOptionDescription(option) {
      if (option.award == null) {
         this.setState({
            showingEditOption: true,
            modalText: "",
            editingOption: this.state.event.options.indexOf(option),
         })
      }else{
         Alert.alert("Remove award?", "Do you want to remove " + option.award + " from this option?", [
            {text: 'Cancel', onPress: () => {}},
            {text: 'Do it!', onPress: () => {
               option.award = null;
               option.dirty = true;
               this.setState({
                  dataSource: this.state.dataSource.cloneWithRows(this.state.event.options)
               })
            }}
         ], { cancelable: false })
      }
   }

   renderRow(option) {
      return (
         <TouchableHighlight
         underlayColor={'rgb(166, 166, 166)'}
         onPress={this.editOptionDescription.bind(this, option)}>
         <View>
         <View style={[styles.row, option.award != null ? {paddingBottom: 0} : null]}>
         <Text style={styles.rowText}>{option.name}</Text>
         <Text style={styles.scoreText}>Score: {option.score}</Text>
         </View>
         {option.award != null ?
            <Text style={styles.rowAwardText}>Award: {option.award}</Text>
            :
            null
         }
         <View style={styles.seperator}/>
         </View>
         </TouchableHighlight>
      );
   }

   releasePressed() {
      var awards = this.state.event.options.filter((option) => {
         console.log(option);
         return option.award != null
      });

      if (awards.length == 0) {
         Alert.alert("You need to give at least one award, Theo", null, [{text: 'Fine', onPress:() => {}}], {cancelable: false});
         return;
      }

      this.setState({
         showCoverModal: true
      });
      ServerCommunicator.current.releaseAwards(awards).then(() => {
         this.setState({
            showCoverModal: false
         });
         this.props.navigator.pop();
      }).catch((error) => {
         Alert.alert("Encountered an error!", error.message, {text: "Ok", onPress: () => {
            this.setState({
               showCoverModal: false
            });
         }}, {cancelable: false});
      })
   }

   render() {
      var emptyText = "Loading...";
      if (this.state.event === null) {
         emptyText = 'There is no event happening now. Create one below';
      }

      return (
         <View style={styles.container}>
         <Modal
         transparent={true}
         visible={this.state.showCoverModal}>
         <View style={{backgroundColor: 'rgba(131, 131, 131, 0.56)', flex: 1, justifyContent: 'center'}}>
         <ActivityIndicator
         size="large"
         color="rgb(0, 0, 0)"
         animating={this.state.showCoverModal}
         style={{alignSelf: 'center'}}/>
         </View>
         </Modal>
         <Modal
         animationType={"fade"}
         transparent={true}
         visible={this.state.showingEditOption}>
         {
            <View style={styles.modalContainer}>
            <View style={styles.modal}>
            <Text style={styles.modalTitle}>Enter the name of the award to assign to this option</Text>
            <TextInput
            style={styles.modalTextInput}
            onChangeText={(text) => {
               this.setState({
                  modalText:text
               });
            }}
            value={this.state.modalText}/>
            <TouchableHighlight
            onPress={() => this.setState({ showingEditOption: false })}
            style={styles.modalButtons}>
            <Text>Cancel</Text>
            </TouchableHighlight>

            <TouchableHighlight
            onPress={() => {
               this.state.event.options[this.state.editingOption].award = this.state.modalText;
               this.state.event.options[this.state.editingOption].dirty = true;
               this.setState({
                  showingEditOption: false,
                  modalText: "",
                  dataSource: this.state.dataSource.cloneWithRows(this.state.event.options)
               })
            }}
            style={styles.modalButtons}>
            <Text>Save</Text>
            </TouchableHighlight>
            </View>
            <View style={{backgroundColor: 'rgba(0,0,0,0)', height: 80}}/>
            </View>
         }
         </Modal>
         <View style={styles.topView}>
         {this.state.event == null ?
            <Text style={styles.currentEventText}>{emptyText}</Text>
            :
            <View>
            <Text style={styles.currentEventText}>Current Event: {this.state.event.name}</Text>
            <ListView
            style={styles.listView}
            renderRow={this.renderRow.bind(this)}
            dataSource={this.state.dataSource}/>
            </View>
         }
         </View>
         <TouchableHighlight
         underlayColor={'rgb(101, 161, 184)'}
         style={styles.createButton}
         onPress={this.createPressed.bind(this)}>
         <Text style={styles.createButtonText}>Create</Text>
         </TouchableHighlight>
         </View>
      );
   }
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: 'rgb(238, 238, 238)',
      alignItems: 'center'
   },
   topView: {
      flex: 1,
   },
   createButton: {
      width: Dimensions.get('window').width,
      alignItems: 'center',
      padding: 10,
      backgroundColor: 'rgb(116, 184, 209)'
   },
   createButtonText: {
      color: 'white',
      textAlign: 'center',
      fontSize: 20,
      fontFamily: "Avenir Next",
      fontWeight: "500"
   },
   currentEventText: {
      fontSize: 16,
      marginLeft: 40,
      marginRight: 40,
      color: 'gray',
      textAlign: 'center'
   },
   listView: {
      marginTop: 10,
      flex: 1,
      width: Dimensions.get('window').width
   },
   row: {
      backgroundColor: 'white',
      justifyContent: 'center',
      flexDirection: 'row',
      padding: 15
   },
   rowAwardText: {
      fontSize: 12,
      backgroundColor: 'white',
      flex: 1,
      textAlign: 'center'
   },
   seperator: {
      height: 1,
      marginLeft: 15,
      backgroundColor: 'rgb(177, 177, 177)',
   },
   rowText: {
      flex: 1,
      fontFamily: 'Avenir Next',
      fontSize: 18,
      textAlign: 'left'
   },
   scoreText: {
      color: 'gray',
      marginLeft: 20,
   },
   modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(71, 71, 71, 0.59)',
      alignItems: 'center',
      justifyContent: 'center'
   },
   modal: {
      height: 200,
      width: 300,
      backgroundColor: 'white',
      alignItems: 'center'
   },
   modalTitle: {
      fontFamily: 'Avenir Next',
      fontSize: 20,
      textAlign: 'center'
   },
   modalTextInput: {
      height: 35,
      width: 150,
      borderColor: 'lightgray',
      borderWidth: 1,
      paddingLeft: 10,
      fontFamily: "Avenir Next",
      borderRadius: 15,
      margin: 10,
      alignSelf: 'center'
   },
   modalButtons: {
      margin: 10,
   }
});

module.exports = VotingEventSettings;
