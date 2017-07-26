import React, { Component } from 'react';
import {
	StyleSheet,
	View,
	TouchableHighlight,
	ListView,
} from 'react-native';

const colorOptions = ['red', 'yellow', 'green', 'purple', 'blue', 'orange', 'pink', 'brown', 'gold'];


class ColorPicker extends Component {
  propTypes: {
		colorSelected: ReactNative.PropTypes.func,
	}

  constructor() {
    super();
    const dataSource = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

    var temp = [];
    var rows = [];
    for (const index in colorOptions) {
      const color = colorOptions[index];
      const rowIndex = index % 4;

      if (rowIndex < 3) {
        temp.push(color);
      } else {
        temp.push(color);
        rows.push(temp);
        temp = [];
      }
    }
    if (temp.length !== 0) {
      rows.push(temp);
    }

    this.state = {
      dataSource: dataSource.cloneWithRows(rows),
      selectedColor: null
    };
  }

  selectedColor(color) {
    this.setState({
      selectedColor: color
    });

    if (this.props.colorSelected != null) {
      this.props.colorSelected(color);
    }
  }

  renderRow(rowData, sectionID, rowID) {
    return (
      <View style={styles.row}>
        <View style={{flex:1}}/>
        <TouchableHighlight
          onPress={this.selectedColor.bind(this, rowData[0])}
          style={[styles.colorPickCell, {backgroundColor: rowData[0]}]}><View/></TouchableHighlight>
        {rowData.length > 1 ? <TouchableHighlight
          onPress={this.selectedColor.bind(this, rowData[1])}
          style={[styles.colorPickCell, {backgroundColor: rowData[1]}]}><View/></TouchableHighlight> : null}
        {rowData.length > 2 ? <TouchableHighlight
          onPress={this.selectedColor.bind(this, rowData[2])}
          style={[styles.colorPickCell, {backgroundColor: rowData[2]}]}><View/></TouchableHighlight> : null}
        {rowData.length > 3 ? <TouchableHighlight
          onPress={this.selectedColor.bind(this, rowData[3])}
          style={[styles.colorPickCell, {backgroundColor: rowData[3]}]}><View/></TouchableHighlight> : null}
        <View style={{flex:1}}/>
      </View>
    );
  }

  render() {
    return (
        <View style={styles.container}>
          <View>
            <ListView
              dataSource={this.state.dataSource}
              style={styles.listView}
              renderRow={this.renderRow.bind(this)}/>
            <View style={{backgroundColor: this.state.selectedColor || 'white', flex: 1}}/>
          </View>
        </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  listView: {
  },
  colorPickCell: {
    width: 50,
    height: 50,
    margin: 15,
    borderRadius: 5,
    shadowOffset: {width: 4, height: 4},
    shadowColor: 'gray',
    shadowOpacity: 0.7
  },
  row: {
    flexDirection: 'row',
  }
});

module.exports = ColorPicker;
