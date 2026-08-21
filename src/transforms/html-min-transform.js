const htmlmin = require('html-minifier');

module.exports = function htmlMinTransform(value, outputPath) {
  if (outputPath.indexOf('.html') > -1) {
    let minified = htmlmin.minify(value, {
      useShortDoctype: true,
      removeComments: true,
      collapseWhitespace: true,
      // The global CSS is already minified by sass and inlined verbatim;
      // letting html-minifier re-minify it drops declarations (csso merge).
      minifyCSS: false
    });
    return minified;
  }
  return value;
};
