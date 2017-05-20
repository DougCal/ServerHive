import React from 'react';
import Bar from './Bar';

const normalizeBars = (keys, currStats) => {
  let divisor = 1;
  for (let i = 0; i < keys.length; i += 1) {
    // console.log('yo', currStats[keys[i]]);
    if (currStats[keys[i]] > 75 && currStats[keys[i]] / 75 > divisor) divisor = Math.floor(currStats[keys[i]] / 75) + 1;
  }
  // console.log(divisor);
  return divisor
}

const CurrStats = (props) => {
  // console.log(props.currStats);
  const keys = props.currStats === undefined ? [] : Object.keys(props.currStats);
  const session = [];
  const rp = [];
  let rpVolume = 0;
  let targetVolume = 0;
  for (let i = 0; i < keys.length; i += 1) {
    // console.log(keys[i]);
    if (keys[i] !== 'session' && keys[i] !== 'Cached Response') {
      targetVolume += props.currStats[keys[i]]
      session.push(
        <Bar server={keys[i]} requests={props.currStats[keys[i]]} divisor={normalizeBars(keys, props.currStats)} />
      );
    }
    if (keys[i] === 'Cached Response') {
      rpVolume += props.currStats[keys[i]]
      rp.push(
        <Bar server={keys[i]} requests={props.currStats[keys[i]]} divisor={normalizeBars(keys, props.currStats)} />
      );
    }
  }
  return (
    <div id = 'panel'>
      <h1>nodeXchange</h1>
      <div id='rp'>
        <h2>Cache Response Volume: {rpVolume}</h2>
        {rp}
      </div>
      <div id='appServers'>
        <h2>App Server Response Volume: {targetVolume}</h2>        
        {session}
      </div>
    </div>
  )
}

export default CurrStats;