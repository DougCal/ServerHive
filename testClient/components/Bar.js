import React from 'react';
// import Background from '../img/server.jpg';

const Bar = (props) => {
  let bar = [];
  // console.log(props.request, ' ', props.divisor);
  for (let i = 0; i < (props.requests / props.divisor); i += 1) {
    bar.push(<div className ='bar'></div>);
  } 
  let serverName = 'App Server';
  switch(props.server) {
    case 'Cached Response':
      serverName = 'Reverse Proxy Cache'
      break;
    case '127.0.0.1:3000':
      serverName = 'App Server 1'
      break; 
    case '127.0.0.1:4000':
      serverName = 'App Server 2'
      break; 
    case '127.0.0.1:5000':
      serverName = 'App Server 3'
      break; 
  }
  return (
    <div className = 'server'>
      <div className = 'serverId'>{serverName}</div>
      <div className = 'serverRequests'>{props.requests}</div>
      {/*<div className = 'bar' style = {{width: props.requests * 5}}></div>*/}
      {bar}
    </div>
  )
}

export default Bar;