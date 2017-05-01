import React from 'react';
import CurrStats from './CurrStats';

const parseStats = (stats) => {
  let resultRender = [];
  let resultData = []
  let showSession = false;
  for (let i = 0; i < stats.length; i += 1) {
    // console.log(stats[i]);
    let date = new Date(stats[i].session);
    let sessionData = {};
    sessionData.session = date.toLocaleString();
    let sessionRender = [<div>Session Start: { date.toLocaleString() }</div>]
    for (let j = 0; j < stats[i].servers.length; j += 1) {
      if (stats[i].servers[j].requests > 0) showSession = true
      sessionData[stats[i].servers[j].serverId] = stats[i].servers[j].requests;
      sessionRender.push(
          <div>
            Server: { stats[i].servers[j].serverId } Requests { stats[i].servers[j].requests }
          </div>
        )
    }
    if (showSession === true) resultRender.push(sessionRender);
    if (showSession === true) resultData.push(sessionData);
    showSession = false;
  }
  // console.log(result);
  return {
    resultRender,
    resultData,
  };
}

const renderHistory = (pStats) => {
  return pStats.slice(1)
}

const Stats = (props) => {
  const stats = parseStats(props.stats);
  // console.log(stats);
  return (
    <div>
      <br/><br/>
      <CurrStats currStats = { stats.resultData[stats.resultData.length - 1] }/>
      <br/><br/>
      {/*{ renderHistory(stats.resultRender) }*/}
    </div>
  )
}

export default Stats;