import React, { Component } from 'react';
import {
   AppRegistry,
   StyleSheet,
   Text,
   View,
   TouchableHighlight,
   ListView,
   Image,
   TextInput,
   ActivityIndicator,
   Modal,
   Alert
} from 'react-native';

let ServerCommunicator = require('./ServerCommunicator').default;


/*
name: "The Pitch",
id: 1,
image: "https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F30750478%2F73808776949%2F1%2Foriginal.jpg?w=1000&rect=38%2C0%2C1824%2C912&s=068ff06280148aa18a9075a68ad6e060",
resultsReleased: false,
description: "You have now seen many pitches, so now please choose the three that you think showed the most merit in your opinion.",
options: [
{name: "Pitch 1", id: 1},
{name: "Pitch 2", id: 2},
{name: "Pitch 3", id: 3},
{name: "Pitch 4", id: 4},
{name: "Pitch 5", id: 5},
{name: "Pitch 6", id: 6},
{name: "Pitch 7", id: 7},
]*/

class CreateVotingEventSettings extends Component {
   propTypes: {
      navigator: React.PropTypes.Object.isRequired
   }

   constructor(props) {
      super(props);

      // The list view dataSource
      const dataSource = new ListView.DataSource({
         rowHasChanged: (r1, r2) => r1 !== r2,
         sectionHeaderHasChanged: (s1, s2) => s1 !== s2
      });

      this.event = {
         name: "",
         description: "",
         image: "",
         options: []
      }
      this.nextID = 0;

      this.state = {
         dataSource: dataSource.cloneWithRowsAndSections(this.loadRows()),
         showCoverModal: false
      };
   }

   loadRows() {
      var generalRows = [
         {
            title: "Name",
            type: "entry",
            key: "name"
         },
         {
            title: "Description",
            type: "entry",
            key: "description"
         },
         {
            title: "Image",
            type: "entry",
            key: "image"
         }
      ]

      var optionRows = [
         {
            title: "New",
            type: "clickable",
            onPress: () => {
               let newOption = {
                  name: "",
                  id: this.nextID++
               }
               this.event.options.push(newOption);
               this.setState({
                  dataSource: this.state.dataSource.cloneWithRowsAndSections(this.loadRows())
               });
            }
         }
      ]

      this.event.options.forEach((option) => {
         optionRows.push({
            title: null,
            type: 'entry',
            key: "option" + option.id
         })
      })

      return {
         general: generalRows,
         options: optionRows
      }
   }

   createEvent=() => {
      if (this.state.name == "" || this.state.name == null) {
         Alert.alert("You need an event name");
         return;
      }
      this.event.name = this.state.name;

      if (this.state.description == ""|| this.state.description == null) {
         Alert.alert("You need an event description");
         return;
      }
      this.event.description = this.state.description;

      if (this.state.image == ""|| this.state.image == null) {
         Alert.alert("You need an event image (a url will do)");
         return;
      }
      this.event.image = this.state.image;

      console.log(this.event.options);
      if (this.event.options.length <= 3) {
         Alert.alert("You need more than 3 options to choose from");
         return;
      }

      this.event.options.forEach((option) => {
         option.name = this.state["option" + option.id];
         delete option.id;
      });

      this.setState({
         showCoverModal: true
      });
      ServerCommunicator.current.submitNewEvent(this.event).then(() => {
         this.props.navigator.pop();
         this.setState({
            showCoverModal: false
         })
      });
   }

   renderRow(data, section, row) {
      return (
         <TouchableHighlight
         style={styles.row}
         onPress={data.type == 'clickable' ? data.onPress : null}>
         <View style={styles.rowTextContainer}>
         <View style={styles.rowTextInnerContainer}>
         {data.title != null ? <Text style={styles.rowTitle}>{data.title}</Text> : null}
         {
            data.type == 'entry' ?
            <TextInput
            style={styles.textField}
            onChangeText={(text) => {
               this.setState({
                  [data.key]:text
               });
            }}
            value={this.state[data.key]}/>
            :
            <Image source={require('./Assets/disclosureIndicator.png')} style={styles.disclosureIndicator}/>
         }
         </View>
         <View style={styles.seperatorSmall}/>


         </View>
         </TouchableHighlight>
      );
   }

   /**
   Gets a view of a section header
   */
   renderSectionHeader(data, sectionName) {
      if (sectionName == "user") {
         return <View/>
      }

      return (
         <View style={styles.sectionHeader}>
         <Text style={styles.sectionHeaderText}>{sectionName.toUpperCase()}</Text>
         </View>
      )
   }

   render() {
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
         <ListView
         dataSource={this.state.dataSource}
         renderRow={this.renderRow.bind(this)}
         renderSectionHeader={this.renderSectionHeader.bind(this)}/>
         </View>
      );
   }
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: 'rgb(238, 238, 238)'
   },
   row: {
      flex: 1,
      flexDirection: 'row',
   },
   rowTextContainer: {
      backgroundColor: 'white',
      paddingLeft: 0,
      flex: 1,
   },
   rowTextInnerContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: 'center'
   },
   rowTitle: {
      padding: 15,
      fontSize: 18,
      flex: 1,
      fontFamily: 'Avenir Next',
   },
   sectionHeader: {
      flex: 1,
      height: 50,
      flexDirection: 'row',
      backgroundColor: 'rgb(238, 238, 238)'
   },
   sectionHeaderText: {
      alignSelf: 'flex-end',
      marginBottom: 10,
      marginLeft: 10,
      fontSize: 10,
      fontFamily: 'Avenir Next',
      fontWeight: '600',
      color: 'grey'
   },
   seperator: {
      height: 1,
      backgroundColor: 'rgb(200, 200, 200)',
      flex: 1
   },
   seperatorSmall: {
      height: 1,
      marginLeft: 20,
      backgroundColor: 'rgb(200, 200, 200)',
      flex: 1
   },
   disclosureIndicator: {
      alignSelf: 'flex-end',
      resizeMode: 'contain',
      height: 15,
      width: 15,
      marginBottom: 20,
      marginRight: 10
   },
   textField: {
      height: 35,
      borderColor: 'lightgray',
      borderWidth: 1,
      paddingLeft: 10,
      fontFamily: "Avenir Next",
      flex: 1,
      borderRadius: 15,
      marginTop: 10,
      marginRight: 10,
      marginBottom: 10,
      marginLeft: 10,
   },
});

module.exports = CreateVotingEventSettings;
