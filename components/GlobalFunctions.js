/**
GlobalFunctions.js
Defines some simple global functions that I use a lot
*/


const env = require('./Environment');
import {GoogleSignin} from 'react-native-google-signin';

class GlobalFunctions {

   static userIsTim() {
      return GoogleSignin.currentUser().email == env.tim// || __DEV__
   }

   static userIsAdmin() {
      if (GoogleSignin.currentUser() == null || GoogleSignin.currentUser().email == null || GoogleSignin.currentUser().email == "") {
         return false
      }

      return env.admins.includes(GoogleSignin.currentUser().email.toLowerCase());
   }
}

export default GlobalFunctions;
