import React from 'react';
import Bar from './Bar';

const CurrStats = (props) => {
  console.log(props.currStats);
  const keys = props.currStats === undefined ? [] : Object.keys(props.currStats);
  const session = []; 
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i] !== 'session') {
      session.push(
        <div>
          <Bar server = { keys[i] } requests = { props.currStats[keys[i]] }/>
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