import React from 'react';
import MetaStore from '../stores/MetaStore.js';
import Sidebar from './Sidebar.jsx';
import TopBar from './Topbar.jsx';
import {connectToStores, provideContext} from 'fluxible/addons';
import {handleHistory} from 'fluxible-router';

const debug = require('debug')('ppt:App');

class App extends React.Component {
    constructor(props, context) {
        super(props, context);
    }
    componentDidUpdate(prevProps) {
        let newProps = this.props;
        if (newProps.MetaStore.pageTitle === prevProps.MetaStore.pageTitle) {
            return;
        }
        document.title = newProps.MetaStore.pageTitle;
    }
    render() {
      var Handler = this.props.currentRoute.get('handler');

      debug('MetaStore', this.props.MetaStore);

      // render content.
      // this.props.onQuery is passed in by Transmit.renderToString.
      return (
        <div>
          <Sidebar />
          <TopBar />
          <Handler onQuery={this.props.onQuery}/>
        </div>
      );
    }
}

App.contextTypes = {
    getStore: React.PropTypes.func,
    executeAction: React.PropTypes.func
};

App = connectToStores(App, [MetaStore], function (stores, props) {
  return {
    MetaStore: stores.MetaStore.getState()
  };
});

App = handleHistory(App);

App = provideContext(App);

export default App;
