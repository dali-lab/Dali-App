/**
StorageController.js
Deals with all the data storage that is necesary throughout the app

AUTHOR: John Kotz
*/

import React, { Component } from 'react';
import {
   AppRegistry,
   AsyncStorage
} from 'react-native';

// To make sure I don't overwrite not my data
const prefix = "@DaliLabApp";

/// Controller of storage
/// NOTE: It doesn't like me saving Bool's, so I convert them to strings and back
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

   /// This one has a default value, so if it is null I will set it to it's default
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

   /// This one has a default value, so if it is null I will set it to it's default
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

   /// This one has a default value, so if it is null I will set it to it's default
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

   /// This one has a default value, so if it is null I will set it to it's default
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

   static getServerUpdateInterval() {
      return new Promise((success, failure) => {
         AsyncStorage.getItem(prefix + ':serverUpdateInterval').then((result) => {
            if (result == null) {
               success(null);
               return;
            }
            success(parseInt(result));
         });
      });
   }

   static saveServerUpdateInterval(value) {
      return AsyncStorage.setItem(prefix + ':serverUpdateInterval', value == null ? value : value.toString());
   }

   static getVoteDone(event) {
      return new Promise((success, failure) => {
         AsyncStorage.getItem(prefix + ':eventVoted:' + event.id).then((result) => {
            success(result == 'true');
         });
      });
   }

   static setVoteDone(event) {
      return AsyncStorage.setItem(prefix + ':eventVoted:' + event.id, 'true');
   }
}

export default StorageController;
