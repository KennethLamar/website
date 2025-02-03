const rssPlugin = require('@11ty/eleventy-plugin-rss');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const embedYouTube = require("eleventy-plugin-youtube-embed");
const tinyCSS = require('@sardine/eleventy-plugin-tinycss');
// const { compress } = require('eleventy-plugin-compress');
const fs = require('fs');

// Import filters
const dateFilter = require('./src/filters/date-filter.js');
const markdownFilter = require('./src/filters/markdown-filter.js');
const w3DateFilter = require('./src/filters/w3-date-filter.js');
const linkPreviewFilter = require('./src/filters/link-preview-filter.js');

// Import transforms
const htmlMinTransform = require('./src/transforms/html-min-transform.js');
const parseTransform = require('./src/transforms/parse-transform.js');

// Import data files
const site = require('./src/_data/site.json');

module.exports = function (config) {
  // Filters
  config.addFilter('dateFilter', dateFilter);
  config.addFilter('markdownFilter', markdownFilter);
  config.addFilter('w3DateFilter', w3DateFilter);
  config.addFilter('linkPreview', linkPreviewFilter);

  // Layout aliases
  config.addLayoutAlias('home', 'layouts/home.njk');

  // Transforms
  config.addTransform('htmlmin', htmlMinTransform);
  config.addTransform('parse', parseTransform);

  // Passthrough copy
  config.addPassthroughCopy('src/fonts');
  config.addPassthroughCopy('src/assets');
  config.addPassthroughCopy('src/js');
  config.addPassthroughCopy('src/files');
  config.addPassthroughCopy('src/admin/config.yml');
  config.addPassthroughCopy('src/admin/previews.js');
  config.addPassthroughCopy('node_modules/nunjucks/browser/nunjucks-slim.js');
  config.addPassthroughCopy('src/robots.txt');
  config.addPassthroughCopy('src/_headers');

  const now = new Date();

  // Custom collections
  const livePosts = post => post.date <= now && !post.data.draft;
  // All posts. Primarily used in archive page and XML feed.
  config.addCollection('posts', collection => {
    return [
      ...collection.getFilteredByGlob('./src/posts/*.md').filter(livePosts)
    ].reverse();
  });
  // Used for home page.
  config.addCollection('postFeed', collection => {
    return [...collection.getFilteredByGlob('./src/posts/*.md').filter(livePosts)]
      .reverse()
      .slice(0, site.maxPostsPerPage);
  });
  // Used for the all tags page.
  config.addCollection('tagList', (collections) => {
    const uniqueTags = collections
      .getFilteredByGlob('./src/posts/*.md')
      .filter(livePosts)
      .reduce((tags, item) => tags.concat(item.data.tags), [])
      .filter((tag) => !!tag)
      .filter((tag) => !!tag && !['page', 'post'].includes(tag))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return Array.from(new Set(uniqueTags));
  });

  // Plugins
  config.addPlugin(rssPlugin);
  config.addPlugin(syntaxHighlight);
  config.addPlugin(embedYouTube, {
    lite: true
  });
  config.addPlugin(tinyCSS, {
    output: 'dist',
  });
  // config.addPlugin(compress, {
  //   enabled: true,
  //   algorithm: 'brotli',
  // });

  // 404
  config.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, browserSync) {
        const content_404 = fs.readFileSync('dist/404.html');

        browserSync.addMiddleware('*', (req, res) => {
          // Provides the 404 content without redirect.
          res.write(content_404);
          res.end();
        });
      }
    }
  });

  return {
    dir: {
      input: 'src',
      output: 'dist'
    },
    passthroughFileCopy: true
  };
};
