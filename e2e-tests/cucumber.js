module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['support/world.js', 'support/hooks.js', 'step_definitions/**/*.js'],
    format: ['summary'],
    formatOptions: { snippetInterface: 'async-await' },
    language: 'es'
  }
};