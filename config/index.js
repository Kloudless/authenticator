'use strict'

module.exports = {
  build: {
    debug: process.env.DEBUG,
    base_url: JSON.stringify(process.env.BASE_URL)
  }
}