const { render } = require('../utils/markdown.js');

module.exports = function markdown(value) {
  return render(value);
};
