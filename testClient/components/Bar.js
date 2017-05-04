import React from 'react';
// import Background from '../img/server.jpg';

const Bar = (props) => {
  let bar = [];
  console.log(props.request, ' ', props.divisor);
  for (let i = 0; i < (props.requests / props.divisor); i += 1) {
    bar.push(<div className ='bar'></div>);
  } 
  return (
    <div className = 'server'>
      <div className = 'serverId'>{props.server}</div>
      <div className = 'serverRequests'>{props.requests}</div>
      {/*<div className = 'bar' style = {{width: props.requests * 5}}></div>*/}
      {bar}
    </div>
  )
}

export default Bar;