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

   static userIsTheo() {
      return GoogleSignin.currentUser().email == env.theo || __DEV__
   }
}

export default GlobalFunctions;
