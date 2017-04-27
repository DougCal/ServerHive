import React from 'react';
import { Component } from 'react';

class App extends Component {
  constructor() {
    super()
    this.state = {
      authenticated: false,
      username: '',
      password: '',
    }
    this.login = this.login.bind(this);
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

  render() {
    const loginForm = (
      <div>
        <input type='text' value={this.state.username} onChange={(e) => this.setState({ username: e.target.value })} /> <br />
        <input type='text' value={this.state.password} onChange={(e) => this.setState({ password: e.target.value })} /> <br />
        <button onClick={this.login}></button>
      </div>
    )
    if (this.state.authenticated === false) {
      return (
        <div>
          You're not logged in! <br />
          {loginForm}
        </div>
      )
    } else {
      return (
        <div>
          Congrats! You're logged in! <br />
        </div>
      )
    }
  }
}

  export default App;

