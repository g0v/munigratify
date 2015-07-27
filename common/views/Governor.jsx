var React = require('react'),
    mui = require('material-ui'),
    debug = require('debug')('ppt:governor'),
    Transmit = require('react-transmit'),
    findAll = require('../utils/findAll'),
    Loading = require('./Loading.jsx');

import PolicySection from './PolicySection.jsx';
import {PROGRESS_OPTIONS} from '../config/constants';
import {majority, findLatestProgressReport} from '../utils';
import { Avatar } from 'material-ui';
import {handleRoute, NavLink} from 'fluxible-router';
import pptSpacing from '../styles/spacing';

var Governor = React.createClass({
  getStyles() {
    return {
      root: {
        paddingTop: pptSpacing.appBarHeight,
        height: '100%',
        width: '100%'
      },
      section: {
        backgroundImage: `url('/images/coverphoto.png')`,
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        width: '100%',
        height: '30%',
        maxWidth: '720',
        minHeight: '240',
        margin: '0px auto 10px',
        position: 'relative'
      },
      avatar: {
        display: 'block',
        height: '72',
        width: '72',
        position: 'absolute',
        top: 24,
        left: '42.5%'
      }
    };
  },

  render () {
    var styles = this.getStyles(),
        governor = this.props.governors[0],
        governorStats = {},
        policyElems;

    if (!governor) {
      let governerName = decodeURIComponent(this.props.currentRoute.get('params').get('name'));
      return (
        <div style={styles.root}>
          <section>
            找不到執政者「{governerName}」 :(
          </section>
        </div>
      )
    }

    governor.Policies = governor.Policies || [];

    policyElems = governor.Policies.map(policy => (
      <PolicySection name={policy.name}
                     commitments={policy.Commitments}
                     key={policy.id} />
    ));

    // Gather commitment stats for the governor
    //
    governor.Policies.forEach(policy => {
      policy.Commitments.forEach(commitment => {
        var latestReport = findLatestProgressReport(commitment.ProgressReports),
            progress = latestReport && majority(latestReport.ProgressRatings.map(rating => rating.progress)) ||
                       PROGRESS_OPTIONS[0];

        governorStats[progress] = governorStats[progress] + 1 || 1;
      });
    });

    return (
      <div style={styles.root}>
        <section style={styles.section}>
          <Avatar style={styles.avatar} src={governor.avatar} />
          <div>
            <div>
              <div>{governorStats.notyet || 0}</div>
              <div>還沒做</div>
            </div>
            <div>
              <div>{governorStats.doing || 0}</div>
              <div>正在做</div>
            </div>
            <div>
              <div>{governorStats.done || 0}</div>
              <div>已完成</div>
            </div>
          </div>
        </section>
        {policyElems}
      </div>
    );
  }
});

Governor = Transmit.createContainer(Governor, {
  queries: {
    governors(queryParams) {
      debug('queryParams', queryParams);
      return findAll('Governor', {
        where: {
          name: queryParams.name
        },
        include: [
          {association: 'Terms'},
          {
            association: 'Policies',
            include: [
              {
                association: 'Commitments',
                include: [
                  {
                    association: 'ProgressReports',
                    include: [
                      {association: 'ProgressReportHistories'},
                      {association: 'ProgressRatings'}
                    ]
                  }
                ]
              }
            ]
          }
        ]
      });
    }
  }
});

// Setup React-transmit via props
//
var GovernorQuerySetter = React.createClass({
  _makeQueryParams () {
    return {
      name: this.props.currentRoute.get('params').get('name')
    }
  },

  render() {
    return (
      <Governor queryParams={this._makeQueryParams()} emptyView={<Loading />}
        {...this.props}
        ref="governor"
      />
    );
  },

  componentDidUpdate(prevProps) {
    if (prevProps.currentRoute !== this.props.currentRoute) {
      this.refs.governor.setQueryParams(this._makeQueryParams());
    }
  }
})

module.exports = handleRoute(GovernorQuerySetter);
