import React from 'react';
import PropTypes from 'prop-types';
import createAuthButton from './createAuthButton';

function BaseButton(props) {
  const {
    title, disabled, className, onClick,
  } = props;
  return (
    <button
      className={className}
      type="button"
      disabled={disabled}
      onClick={disabled ? null : onClick}
    >
      {title}
    </button>
  );
}

BaseButton.propTypes = {
  disabled: PropTypes.bool,
  title: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};

BaseButton.defaultProps = {
  disabled: false,
  title: 'Connect Account',
  className: '',
};

const AuthButton = createAuthButton(BaseButton);

export default AuthButton;
