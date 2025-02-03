const metascraper = require('metascraper')([
  require('metascraper-youtube')(),
  require('metascraper-amazon')(),
  require('metascraper-spotify')(),
  require('metascraper-soundcloud')(),
  require('metascraper-title')(),
  require('metascraper-url')(),
  require('metascraper-author')(),
  require('metascraper-date')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-logo')(),
  require('metascraper-logo-favicon')(),
  require('metascraper-publisher')(),
  require('metascraper-clearbit')()
])
const got = require('got')

// Temporary while fixing async version.
const markdownIt = require('markdown-it')({
  html: true,
  breaks: true,
  linkify: true
});

const NodeCache = require( "node-cache" );
const cache = new NodeCache();

module.exports = function linkPreviewFilter(targetUrl, fullImage=false) {
  return markdownIt.render(targetUrl)
};

// module.exports = async function linkPreviewFilter(targetUrl, fullImage=false) {
//   return (async () => {
//     // Try to get the metadata from the cache.
//     var metadata = cache.get(targetUrl);
//     // If it isn't cached.
//     if(!metadata) {
//       // Make a web request.
//       const { body: html, url } = await got(targetUrl);
//       metadata = await metascraper({ html, url });
//       // Cache it for subsequent runs.
//       // Caching is retained for about a year.
//       cache.set(targetUrl, metadata, 31556952);
//     }
//     // DEBUG
//     //console.log(metadata);

//     return `<a class="lp" href="${targetUrl}">
//       <div class="flow">
//         <div class="img">` +
//           (metadata.logo ? `<img class="lp-img" src="${metadata.logo}" alt="${metadata.publisher}">` : '') +
//         `</div>
//         <div class="met">` +
//           (metadata.title ? `<strong class="ttl">${metadata.title}<br></strong>` : '') +
//           (metadata.description ? `<span class="dsc">${metadata.description}</span>` : '') +
//           '<div class=attr>'+
//             (metadata.author ? `<em class="by">${metadata.author}</em>` : '') +
//             (metadata.publisher ? `<em class="pub">${metadata.publisher}</em>` : '') +
//           '</div>'+
//         `</div>
//       </div>` +
//       (fullImage && metadata.image ? `<img class="lp-img" src="${metadata.image}" alt="${metadata.title}">` : '') +
//     '</a>'.replace(/[\n\r]/g, ' ');
//   })()
// };
