import React, { Component } from "react";
import { Field, reduxForm } from "redux-form";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import Alert from "react-s-alert";
import ErrorPage from "../components/errorPage";

import { createPost } from "../actions/posts";

class PostNew extends Component {
  showAlert(message) {
    Alert.info(message, {
      position: "top-right",
      effect: "slide",
      timeout: 2000,
      offset: "50px"
    });
  }

  renderField(field) {
    const {
      meta: { touched, error }
    } = field;
    //-> touched = field.meta.touched
    //-> error = field.meta.error
    const className = `${touched && error ? "invalid" : ""}`;
    const txtAreaClassName = `materialize-textarea ${className}`;

    if (field.input.name === "content") {
      return (
        <div className="input-field col s12" id="contentDiv">
          <textarea
            className={txtAreaClassName}
            id={field.input.name}
            type="text"
            {...field.input}
          />
          <label htmlFor={field.input.name}>{field.input.name}</label>
          <span className="helper-text red-text">{touched ? error : ""}</span>
        </div>
      );
    }
    return (
      <div className="input-field col s6">
        <input
          className={className}
          id={field.input.name}
          type="text"
          {...field.input}
        />
        <label htmlFor={field.input.name}>{field.input.name}</label>
        <span className="helper-text red-text">{touched ? error : ""}</span>
      </div>
    );
  }

  onSubmit(values) {
    this.props.createPost(values, () => {
      this.showAlert("Post Successfully Added!");
      this.props.history.push("/")
    });
  }

  render() {
    if (this.props.error && this.props.error.status) {
      return <ErrorPage />
    }
    // handleSubmit is from Redux Form, it handles validation etc.
    const { handleSubmit } = this.props;
    const isDisabled = this.props.isPending? 'disabld': ''
    return (
      <div className="row">
        <form
          onSubmit={handleSubmit(this.onSubmit.bind(this))}
          //                     ▲ ▲ ▲ ▲ ▲ ▲ ▲
          // this.onSubmit() referes to the onSubmit() method of this component,
          // it handles the submission of the form
          className="col s12"
        >
          <div className="row">
            <Field name="title" component={this.renderField} />
            <Field name="content" component={this.renderField} />
            <div className=" col s12">
              <button
                className={`btn waves-effect waves-light from-btn cyan darken-1 ${isDisabled}`}
                type="submit"
              >
                Submit
              </button>
              <Link
                className="btn waves-effect waves-light red lighten-1 from-btn"
                to="/"
              >
                Back
              </Link>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

// The 'validate' function will be called AUTOMATICALLY by Redux Form
// whenever a user attempts to submit the form
function validate(values) {
  const errors = {};
  // Validate the inputs from 'values'
  if (!values.title) {
    errors.title = "Please enter a title";
  }
  if (!values.content) {
    errors.content = "Please enter some content";
  }
  //if the "errors" object is empty, the form is valid and ok to submit
  return errors;
}

const mapStateToProps = ({ posts: { isPending }, error }) => ({ isPending, error });

export default reduxForm({
  validate, // -> validate: validate
  form: "PostsNewForm"
  //value of "form" must be unique
})(
  connect(
    mapStateToProps,
    { createPost }
  )(PostNew)
);
