import React from 'react';
import Stats from './Stats';
import { Component } from 'react';
import styles from '../styles/main.scss';

class App extends Component {
  constructor() {
    super()
    this.state = {
      authenticated: false,
      username: '',
      password: '',
      stats: [],
    }
    this.login = this.login.bind(this);
    this.verifyUser = this.verifyUser.bind(this);
    this.getStats = this.getStats.bind(this);
    this.openSocket = this.openSocket.bind(this);
    this.wsSend = (message) => console.log('socket not open yet');
  }

  login() {
    var xhr = new XMLHttpRequest();
    const that = this;
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        if (xhr.responseText === 'true') that.setState({ authenticated: true });
      }
    };
    xhr.open('POST', 'login', true);
    xhr.send(JSON.stringify({ username: this.state.username, password: this.state.password }));
    this.setState({ username: '', password: '' })
  }

  verifyUser() {
    var xhr = new XMLHttpRequest();
    const that = this;
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        console.log('verified ', xhr.responseText);
        if (xhr.responseText === 'true') that.setState({ authenticated: true });
        console.log(that.state.authenticated);
      }
    };
    xhr.open('GET', 'verifyUser', true);
    xhr.send();
  }

  getStats() {
    var xhr = new XMLHttpRequest();
    const that = this;
    xhr.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        // console.log('stats ', xhr.responseText);
        that.setState({ stats: JSON.parse(xhr.responseText) });
      }
    };
    xhr.open('GET', 'stats', true);
    xhr.send();
  }

  openSocket() {
    const ws = new WebSocket('ws://localhost:1337');
    ws.onopen = () => {
      ws.send('Im here!')
      // const payload = { socketPoolId: 5 };
      // ws.send(JSON.stringify(payload));
    }
    ws.onmessage = (m) => {
      console.log('socket', m.data);
    }
    return (message) => ws.send(message)
  }

  componentDidMount() {
    this.verifyUser();
    this.getStats();
    setInterval(this.getStats, 300);
    console.log('verifying. . .');
    // setInterval(this.getStatsSocket, 250);
    this.wsSend = this.openSocket();
  }

  render() {
    const loginForm = (
      <div id = 'loginForm'>
        <input type='text' value={this.state.username} onChange={(e) => this.setState({ username: e.target.value })} /> <br />
        <input type='text' value={this.state.password} onChange={(e) => this.setState({ password: e.target.value })} /> <br />
        <button id = 'loginButton' onClick={this.login}>Login</button>
      </div>
    )
    if (this.state.authenticated === false) {
      return (
        <div>
          {loginForm}
        </div>
      )
    } else {
      return (
        <div>
          {/*<button onClick = {() => this.wsSend(JSON.stringify({ socketPoolId: 3 }))}>Socket Send Pool 3</button><br />
          <button onClick = {() => this.wsSend(JSON.stringify({ socketPoolId: 4 }))}>Socket Send Pool 4</button><br />
          <button onClick = {() => this.wsSend(JSON.stringify({ socketPoolId: 5 }))}>Socket Send Pool 5</button><br />
          <button onClick = {() => this.getStats()}>GetStats</button><br />
          Congrats! You're logged in! <br />*/}
          <Stats stats = {this.state.stats}/>
        </div>
      )
    }
  }
}

export default App;

