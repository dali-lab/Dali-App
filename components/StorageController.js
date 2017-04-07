import React, { Component } from 'react';
import {
  AppRegistry,
  AsyncStorage
} from 'react-native';
let env = require('./Environment');

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

  static getLabPresencePreference() {
    return new Promise((success, failure) => {
      AsyncStorage.getItem(prefix + ':labPresencePref').then((result) => {
        if (result == null) {
          this.saveLabPresencePreference(false);
          success(false);
          return;
        }
        success(result == 'true');
      })
    });
  }

  static saveLabPresencePreference(value) {
    return AsyncStorage.setItem(prefix + ':labPresencePref', value.toString())
  }

  static getBluetoothNotified() {
    return new Promise((success, failure) => {
      AsyncStorage.getItem(prefix + ':bluetoothNotified').then((result) => {
        if (result == null) {
          this.saveBluetoothNotified(false);
          success(false);
          return;
        }
        success(result == 'true');
      });
    });
  }

  static saveBluetoothNotified(value) {
    return AsyncStorage.setItem(prefix + ':bluetoothNotified', value.toString());
  }

  static userIsTim(user) {
    return user.email == env.tim// || __DEV__
  }
}

export default StorageController;
