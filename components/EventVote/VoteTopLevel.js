import { StackNavigator } from 'react-navigation';

const VoteMain = require('./VoteMain');
const VoteResults = require('./VoteResults');
const VoteSelection = require('./VoteSelection');
const VoteWait = require('./VoteWait');

const navigator = StackNavigator({
  Main: {
    screen: VoteMain,
    path: 'main',
    navigationOptions: {
      title: 'Voting'
    }
  },
  Results: {
    screen: VoteResults,
    path: 'main/:id'
  },
  VoteSelection: {
    screen: VoteSelection,
    path: 'main/selection'
  },
  VoteWait: {
    screen: VoteWait,
    path: 'main/wait'
  }
}, {
  navigationOptions: {
    headerTitleStyle: {
      color: 'white'
    },
    headerStyle: {
      backgroundColor: 'rgb(33, 122, 136)'
    },
    headerTintColor: 'rgb(89, 229, 205)'
  },
});

export default navigator;
