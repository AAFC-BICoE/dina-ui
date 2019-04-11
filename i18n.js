const NextI18Next = require('next-i18next/dist/commonjs')
const { localeSubpaths } = require('next/config').default().publicRuntimeConfig

module.exports = new NextI18Next({
  otherLanguages: ['fr'],
  localeSubpaths
})

