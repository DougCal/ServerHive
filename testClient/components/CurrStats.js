import React from 'react';
import Bar from './Bar';

const normalizeBars = (keys, currStats) => {
  let divisor = 1;
  for (let i = 0; i < keys.length; i += 1) {
    console.log('yo', currStats[keys[i]]);
    if (currStats[keys[i]] > 120 && currStats[keys[i]]/120 > divisor) divisor = Math.floor(currStats[keys[i]]/120) + 1;
  }
  console.log(divisor);
  return divisor
}

const CurrStats = (props) => {
  console.log(props.currStats);
  const keys = props.currStats === undefined ? [] : Object.keys(props.currStats);
  const session = []; 
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i] !== 'session') {
      session.push(
        <div>
          <Bar server = { keys[i] === 'lb'? 'Cached Response' : keys[i] } requests = { props.currStats[keys[i]] } divisor = { normalizeBars(keys, props.currStats) }/>
        </div>
      );
    }
  }
  return (
    <div>
      {session}
    </div>
  )
}

export default CurrStats;