const NextI18Next = require('next-i18next/dist/commonjs')
const NextI18NextInstance = new NextI18Next({
  defaultLanguage: 'en',
  otherLanguages: ['fr'],
  localeSubpaths: 'foreign'
})

module.exports.default = NextI18NextInstance

/* Optionally, export class methods as named exports */
module.exports = {
  appWithTranslation,
  withNamespaces,
  Trans,
  Link,
  Router
} = NextI18NextInstance


