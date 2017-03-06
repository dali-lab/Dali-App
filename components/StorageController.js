import React, { Component } from 'react';
import {
  AppRegistry,
  AsyncStorage
} from 'react-native';

class StorageController {
  static saveColor(color) {
    return AsyncStorage.setItem('@DaliLabApp:selectedColor', color);
  }

  static getColor() {
    return AsyncStorage.getItem('@DaliLabApp:selectedColor');
  }
}

export default StorageController;
