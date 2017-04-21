/**
 GlobalFunctions.js
 Defines some simple global functions that I use a lot
 */


const env = require('./Environment');
import {GoogleSignin} from 'react-native-google-signin';

class GlobalFunctions {
  static userIsDALIMember () {
    return GoogleSignin.currentUser() != null ? GlobalFunctions.isDALIMember(GoogleSignin.currentUser()) : false;
  }

  static isDALIMember (user) {
    return user == null ? false : user.email.includes('@dali.dartmouth.edu');
  }

  static currentLabUser () {
    return GlobalFunctions.userIsDALIMember() ? GoogleSignin.currentUser() : null;
  }

  static userIsTim() {
    return GoogleSignin.currentUser().email == env.tim// || __DEV__
  }
}

export default GlobalFunctions;
