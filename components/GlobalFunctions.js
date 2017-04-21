/**
 GlobalFunctions.js
 Defines some simple global functions that I use a lot
 */


const env = require('./Environment');
import {GoogleSignin} from 'react-native-google-signin';

class GlobalFunctions {
  static userIsDALIMember () {
    return GoogleSignin.currentUser() != null ? GlobalFunctions.userIsDALIMember(GoogleSignin.currentUser()) : false;
  }

  static userIsDALIMember (user) {
    return user.email.includes('@dali.dartmouth.edu') || __DEV__;
  }

  static currentLabUser () {
    return GlobalFunctions.userIsDALIMember() ? GoogleSignin.currentUser() : null;
  }

  static userIsTim() {
    return GoogleSignin.currentUser().email == env.tim// || __DEV__
  }
}

export default GlobalFunctions;
