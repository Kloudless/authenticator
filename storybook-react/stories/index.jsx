/* eslint-disable react/prop-types */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { configureReadme } from 'storybook-readme';
import {
  withKnobs, text, boolean, object,
} from '@storybook/addon-knobs';
import reactReadme from '../../README.react.md';
import footerReadme from '../../storybook-common/README.footer.md';

import { createAuthButton, AuthButton } from '../../src/react';

const APP_ID = (process.env.STORYBOOK_KLOUDLESS_APP_ID
  || 'J2hLI4uR9Oj9_UiJ2Nnvhj9k1SxlZDG3xMtAQjvARvgrr3ie');

const stories = storiesOf('Authenticator with React', module);

configureReadme({ footer: footerReadme });

stories.addDecorator(withKnobs);
stories.addParameters({
  readme: {
    content: reactReadme,
    DocPreview: ({ children }) => (
      <div className="p-3">{children}</div>
    ),
    StoryPreview: ({ children }) => (
      <div className="jumbotron m-3">{children}</div>
    ),
    FooterPreview: ({ children }) => (
      <div className="mt-3">{children}</div>
    ),
  },
});

stories.add('example', () => {
  const comp = ({ onClick }) => (
    <button
      type="button"
      className="btn btn-primary"
      onClick={onClick}
    >
      Custom Button
    </button>
  );
  const Wrapper = createAuthButton(comp);
  return (
    <div>
      <ul className="list-unstyled">
        You can play with the buttons below and see how it works in right panel:
        <li>
          <strong>Knobs </strong>
          edit props (e.g. config.scope, config.client_id)
        </li>
        <li>
          <strong>Actions </strong>
          print logs and arguments of callback functions
        </li>
        <li>
          <strong>* </strong>
          We use Bootstrap CSS here for demonstration
        </li>
      </ul>
      <h4>AuthButton Example</h4>
      <p>
        <AuthButton
          title={text('(AuthButton) title', 'Connect Account', 'AuthButton')}
          disabled={boolean('(AuthButton) disabled', false, 'AuthButton')}
          className={text(
            '(AuthButton) className', 'btn btn-outline-dark', 'AuthButton',
          )}
          onSuccess={action('(AuthButton) onSuccess() called')}
          onError={action('(AuthButton) onError() called')}
          onClick={action('(AuthButton) onClick() called')}
          options={object(
            '(AuthButton) config', {
              client_id: APP_ID,
              scope: 'any.all',
              extra_data: '',
              oob_loading_delay: 2000,
            },
            'AuthButton',
          )}
        />
      </p>
      <h4>createAuthButton Example</h4>
      <p>
        <Wrapper
          onSuccess={action('(createAuthButton) onSuccess() called')}
          onError={action('(createAuthButton) onError() called')}
          onClick={action('(createAuthButton) onClick() called')}
          options={object(
            '(createAuthButton) config', {
              client_id: APP_ID,
              scope: 'any.all',
              extra_data: '',
              oob_loading_delay: 2000,
            },
            'createAuthButton',
          )}
        />
      </p>
    </div>
  );
});
