import React from 'react';

const Bar = (props) => {
  return (
    <div className = 'server'>
      <div className = 'serverData'>{props.server}: {props.requests}</div>
      <div className = 'bar' style = {{width: props.requests * 5}}></div>
    </div>
  )
}

export default Bar;