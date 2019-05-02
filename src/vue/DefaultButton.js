export default {
  functional: true,
  render(createElement, context) {
    return createElement('button', {
      ...context.data, // passing attributes and event handlers
      domProps: { textContent: context.props.title },
    });
  },
  props: {
    title: {
      type: String,
      default: 'Connect Account',
    },
  },
};
