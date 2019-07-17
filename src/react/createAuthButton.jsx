import React from 'react';
import PropTypes from 'prop-types';
import hoistNonReactStatic from 'hoist-non-react-statics';
import auth from '../auth-widget';

function createAuthButton(WrappedComponent) {
  class Wrapper extends React.Component {
    constructor(props) {
      super(props);
      this.onWrappedCompClick = this.onWrappedCompClick.bind(this);
      this.onResult = this.onResult.bind(this);
    }

    onResult(result) {
      const { onError, onSuccess } = this.props;
      if (result.error) {
        onError(result);
      } else {
        onSuccess(result);
      }
    }

    onWrappedCompClick(...params) {
      const { onClick, options } = this.props;
      onClick(...params);
      auth.authenticator(options, this.onResult).launch();
    }

    render() {
      const {
        options, onSuccess, onError, onClick, ...rest
      } = this.props;
      // Pass the props except config, onSuccess, onError and onClick
      // We pass this.onWrappedCompClick instead of this.props.onClick and
      // handle authenticator stuff in this.onWrappedCompClick
      return <WrappedComponent {...rest} onClick={this.onWrappedCompClick} />;
    }
  }

  // Set display name
  const displayName = WrappedComponent.displayName || WrappedComponent.name
    || 'Component';
  Wrapper.displayName = `createAuthButton(${displayName})`;

  // hoist non-react static methods
  hoistNonReactStatic(Wrapper, WrappedComponent);

  // set prop type
  Wrapper.propTypes = {
    options: PropTypes.shape({
      client_id: PropTypes.string.isRequired,
      scope: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
      ]),
      extra_data: PropTypes.string,
      oob_loading_delay: PropTypes.number,
    }).isRequired,
    onSuccess: PropTypes.func.isRequired,
    onError: PropTypes.func,
    onClick: PropTypes.func,
  };

  // set default props
  Wrapper.defaultProps = {
    onClick: () => {},
    onError: () => {},
  };

  return Wrapper;
}

export default createAuthButton;
