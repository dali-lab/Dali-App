import React, { Component } from 'react';
import {
   Animated
} from 'react-native';

class DynamicListRow extends Component {
   _defaultTransition  = 250;

   state = {
       _rowHeight : new Animated.Value(0)
   };

   componentDidMount() {
       Animated.timing(this.state._rowHeight, {
           toValue  : 1,
           duration : this._defaultTransition
       }).start();
   }

   render() {
       return (
           <Animated.View
               style={{height: this.state._rowHeight}}>
               {this.props.children}
           </Animated.View>
       );
   }
}

module.exports = {DynamicListRow};
