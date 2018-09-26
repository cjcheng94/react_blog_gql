import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { userLogout } from "../actions/user";
import { withStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import AccountCircle from "@material-ui/icons/AccountCircle";
import Button from "@material-ui/core/Button";
import LinearProgress from "@material-ui/core/LinearProgress";
import Snackbar from "@material-ui/core/Snackbar";
import { compose } from "redux";

const styles = {
  toolBar:{
    justifyContent: 'space-between'
  },
  brand: {
    fontFamily: 'Notable, sans-serif',
    fontSize: "2.4em",
    textDecorationLine: 'none',
    marginTop: -16,
    textShadow: '0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb,0 4px 0 #b9b9b9,0 5px 0 #aaa,0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25), 0 10px 10px rgba(0,0,0,.2), 0 20px 20px rgba(0,0,0,.15)'
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20
  }
};
class Header extends Component {
  state = {
    open: false
  };
  showAlert() {
    this.setState({ open: true });
  }
  hideAlert() {
    this.setState({ open: false });
  }
  handleLogoutClick(e) {
    e.preventDefault();
    this.props.userLogout(() => {
      this.showAlert();
      setTimeout(() => this.props.history.push("/"), 1000);
    });
  }

  render() {
    const logo = window.innerWidth < 400 ? "B!" : "BLOG!";
    const { classes, isAuthenticated } = this.props;

    return (
      <Fragment>
        <AppBar position="static">
          <Toolbar className={classes.toolBar}>
            <Typography
              color="inherit"
              className={classes.brand}
              component={Link}
              to="/"
            >
              {logo}
            </Typography>

            {/* Show different sets of buttons based on whether user is signed in or not*/}
            {isAuthenticated
            ? (
              <div>
                <IconButton
                  aria-haspopup="true"
                  color="inherit"
                  component={Link}
                  to={`/user/profile/${this.props.username}`}
                >
                  <AccountCircle />
                </IconButton>
                <Button
                  aria-haspopup="true"
                  onClick={this.handleLogoutClick.bind(this)}
                  color="inherit"
                >
                  Log Out
                </Button>
              </div>
            ) 
            : (
              <div>
                <Button
                  aria-haspopup="true"
                  color="inherit"
                  component={Link}
                  to="/user/login"
                >
                  Log In
                </Button>
                <Button
                  aria-haspopup="true"
                  color="inherit"
                  component={Link}
                  to="/user/signup"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </Toolbar>
        </AppBar>

        {/* Show Progress Bar */}
        {this.props.isPending ? (
          <LinearProgress color='secondary' />
        ) : (
          <div style={{ height: 5 }} />
        )}
        
        {/* material-ui's Alert Component */}
        <Snackbar
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left"
          }}
          open={this.state.open}
          autoHideDuration={4000}
          onClose={this.hideAlert.bind(this)}
          ContentProps={{
            "aria-describedby": "message-id"
          }}
          message={<span id="message-id">Logout successful</span>}
        />
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  isAuthenticated: state.user.isAuthenticated,
  username: state.user.username,
  isPending: state.isPending
});

export default compose(
  withStyles(styles, {
    name: "Header"
  }),
  connect(
    mapStateToProps,
    { userLogout }
  )
)(Header);
