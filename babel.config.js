module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
  ],
  plugins: [
    ['transform-define', {
      DEBUG: process.env.DEBUG === 'true',
      BASE_URL: process.env.BASE_URL || 'https://api.kloudless.com',
    }],
  ],
};
