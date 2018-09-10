import React, { Component } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import Alert from "react-s-alert";

import { userLogout } from "../actions/user";
import HeaderButton from "../components/headerButton";

const buttonList = [
  {
    to: "/posts/new",
    text: "Write"
  },
  {
    to: "/user/signup",
    text: "Sign Up"
  },
  {
    to: "/user/login",
    text: "Log In"
  }
];
class Header extends Component {
  //react-s-alert config
  showAlert(message) {
    Alert.info(message, {
      position: "top-right",
      effect: "slide",
      timeout: 2000,
      offset: "50px"
    });
  }

  handleLogoutClick(e) {
    e.preventDefault();
    this.props.userLogout(() => {
      this.showAlert("Logged out");
      setTimeout(() => this.props.history.push("/"), 1000);
    });
  }

  render() {
    //Returns different sets of buttons based user auth state
    const buttons = this.props.isAuthenticated
      ? buttonList.slice(0, 1)
      : buttonList.slice(1);
    const logo = window.innerWidth < 400 ? "B!" : "BLOG!";
    return (
      <div>
        <div className="navbar-fixed">
          <nav className="cyan darken-1">
            <div className="nav-wrapper container">
              <Link to="/" className="brand-logo left">
                {logo}
              </Link>
              <ul id="nav-mobile" className="right">
                {/*Show user's info on header when logged in*/}
                {this.props.isAuthenticated ? (
                  <li>
                    <Link to={`/user/profile/${this.props.username}`}>
                      {this.props.username}
                    </Link>
                  </li>
                ) : null}
                {/*Render buttons according to user login state */}
                {buttons.map(button => {
                  return (
                    <HeaderButton
                      key={button.to}
                      to={button.to}
                      text={button.text}
                    />
                  );
                })}
                {/*Render a log out button when user is logged in*/}
                {this.props.isAuthenticated ? (
                  <li className="waves-effect waves-light">
                    <a onClick={this.handleLogoutClick.bind(this)}>Log out</a>
                  </li>
                ) : null}
              </ul>
            </div>
          </nav>
        </div>
        {//Show a progress bar based on isPending state
        this.props.isPending ? (
          <div className="progress">
            <div className="indeterminate" />
          </div>
        ) : (
          <div className="placeholder" />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({
  isPending,
  user: { isAuthenticated, username }
}) => ({
  isAuthenticated,
  isPending,
  username
});

export default connect(
  mapStateToProps,
  { userLogout }
)(Header);
