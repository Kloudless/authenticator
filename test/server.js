

const express = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(morgan('dev'));
app.use(require('stylus').middleware(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..')));

if (!process.env.KLOUDLESS_APP_ID) {
  // eslint-disable-next-line no-console
  console.log('Environment variable KLOUDLESS_APP_ID not specified.');
  process.exit(1);
}

app.get('/', (req, res) => {
  res.render('index', { app_id: process.env.KLOUDLESS_APP_ID });
});

app.listen(app.get('port'), () => {
  // eslint-disable-next-line no-console
  console.log(`Express server listening on port ${app.get('port')}`);
});
