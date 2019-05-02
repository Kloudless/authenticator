import auth from '../auth-widget';
import DefaultButton from './DefaultButton';

const createAuthButton = (WrappedComponent = DefaultButton) => ({
  props: {
    ...WrappedComponent.props,
    options: {
      type: Object,
      required: true,
    },
  },
  methods: {
    click(...args) {
      this.$emit('click', ...args);
      auth.authenticator({ ...this.options }, this.onResult).launch();
    },
    onResult(result) {
      if (result.error) {
        this.$emit('error', result);
      } else {
        this.$emit('success', result);
      }
    },
  },
  render(createElement) {
    const { options, ...restProps } = this.$props;
    const element = createElement(WrappedComponent, {
      props: restProps,
      attrs: this.$attrs,
      // Listen to the native click event if the wrapped component doesn't
      // explicitly emit it.
      nativeOn: {
        click: this.click,
      },
      // Bind event listeners to the wrapped component
      on: {
        ...this.$listeners,
        click: this.click,
      },
    });
    return element;
  },
});

export default createAuthButton;
