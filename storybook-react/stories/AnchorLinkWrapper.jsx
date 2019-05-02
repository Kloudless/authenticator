/* eslint-disable react/prop-types */
import React from 'react';

export default class AnchorHelper extends React.Component {
  componentDidMount() {
    setAnchorLinkClickListener(); // eslint-disable-line no-undef
  }

  render() {
    const { children } = this.props;
    return (<div>{children}</div>);
  }
}
