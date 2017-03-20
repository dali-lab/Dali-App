import React, { Component } from 'react';
import {
  AppRegistry,
  AsyncStorage
} from 'react-native';

const prefix = "@DaliLabApp";

class StorageController {
  static saveColor(color) {
    return AsyncStorage.setItem(prefix + ':selectedColor', color);
  }

  static getColor() {
    return AsyncStorage.getItem(prefix + ':selectedColor');
  }

  static saveCheckInNotifPreference(value) {
    return AsyncStorage.setItem(prefix + ':checkInNotifPref', value.toString());
  }

  static getCheckinNotifPreference() {
    return new Promise((success, failure) => {
      AsyncStorage.getItem(prefix + ':checkInNotifPref').then((result) => {
        if (result == null) {
          this.saveCheckInNotifPreference(true);
          success(true);
          return;
        }
        success(result == 'true');
      });
    });
  }

  static saveLabAccessPreference(value) {
    return AsyncStorage.setItem(prefix + ':labAccessNotifPref', value.toString());
  }

  static getLabAccessPreference() {
    return new Promise((success, failure) => {
      AsyncStorage.getItem(prefix + ':labAccessNotifPref').then((result) => {
        if (result == null) {
          this.saveLabAccessPreference(false);
          success(false);
          return;
        }
        success(result == 'true');
      });
    });
  }
}

export default StorageController;
