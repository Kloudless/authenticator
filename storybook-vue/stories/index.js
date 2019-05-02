import { storiesOf } from '@storybook/vue';
import {
  withKnobs, text, boolean, object,
} from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import { configureReadme } from 'storybook-readme';
import vueReadme from '../../README.vue.md';
import readmeFooter from '../../storybook-common/README.footer.md';
import CustomButton from './CustomButton';
import { AuthButton, createAuthButton } from '../../src/vue';


const CustomAuthButton = createAuthButton(CustomButton);

const APP_ID = (process.env.STORYBOOK_KLOUDLESS_APP_ID
  || 'J2hLI4uR9Oj9_UiJ2Nnvhj9k1SxlZDG3xMtAQjvARvgrr3ie');

const stories = storiesOf('Authenticator with Vue', module);
configureReadme({ footer: readmeFooter });
stories.addDecorator(withKnobs);
stories.addParameters({
  readme: {
    content: vueReadme,
    DocPreview: {
      template: '<div class="p-3"><slot></slot></div>',
    },
    StoryPreview: {
      template: '<div class="jumbotron m-3"><slot></slot></div>',
    },
    FooterPreview: {
      template: '<div class="mt-3"><slot></slot></div>',
    },
  },
});

const OPTIONS = {
  client_id: APP_ID,
  scope: 'any.all',
  extra_data: '',
  oob_loading_delay: 2000,
};

stories.add('example', () => ({
  components: {
    'auth-button': AuthButton,
    'custom-auth-button': CustomAuthButton,
  },
  props: {
    authButtonOptions: {
      type: Object,
      default: object('(AuthButton) options', { ...OPTIONS }, 'AuthButton'),
    },
    customAuthButtonOptions: {
      type: Object,
      default: object(
        '(createAuthButton) options', { ...OPTIONS }, 'createAuthButton',
      ),
    },
    authButtonTitle: {
      type: String,
      default: text('(AuthButton) title', 'Connect Account', 'AuthButton'),
    },
    authButtonDisabled: {
      type: Boolean,
      default: boolean('(AuthButton) disabled', false, 'AuthButton'),
    },
    authButtonClass: {
      type: String,
      default: text('(AuthButton) class', 'btn btn-outline-dark', 'AuthButton'),
    },
  },
  methods: {
    eventHandler(name, event, ...args) {
      action(`(${name}) receive '${event}' event`)(...args);
    },
  },
  template: `
    <div class="text-left">
      <div>
        <ul class="list-unstyled">
          You can play with the buttons below and see how it works in right panel:
          <li>
            <strong>Knobs </strong>
            edit props (ex: options.scope, options.client_id)
          </li>
          <li>
            <strong>Actions </strong>
            print logs and arguments of callback functions
          </li>
          <li>
            <strong>* </strong>
            We use bootstrap CSS here for demonstration
          </li>
        </ul>
      </div>
      <div class="mb-3">
        <h4>AuthButton</h4>
        <div>
          <auth-button
            :class="authButtonClass"
            :options="authButtonOptions"
            :title="authButtonTitle"
            :disabled="authButtonDisabled"
            @click="eventHandler('AuthButton', 'click', ...arguments)"
            @error="eventHandler('AuthButton', 'error', ...arguments)"
            @success="eventHandler('AuthButton', 'success', ...arguments)" />
        </div>
      </div>
      <div class="mb-3">
        <h4>createAuthButton</h4>
        <div>
          <custom-auth-button
            :options="customAuthButtonOptions"
            @click="eventHandler('createAuthButton', 'click', ...arguments)"
            @error="eventHandler('createAuthButton', 'error', ...arguments)"
            @success="eventHandler('createAuthButton', 'success', ...arguments)"/>
        </div>
      </div>
    </div>`,
}));
