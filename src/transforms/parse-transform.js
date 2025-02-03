const jsdom = require('@tbranyen/jsdom');
const { JSDOM } = jsdom;
const minify = require('../utils/minify.js');
const slugify = require('slugify');

const Image = require("@11ty/eleventy-img");
const fs = require("fs").promises;

function imageShortcode(src, cls = "", alt = "",
  sizes = "(min-width: 30em) 50vw, 100vw",
  widths = [300, 600, 928, 1280, 1856, "auto"],
  loading = "lazy") {
  let options = {
    widths: widths,
    formats: ["webp", "jpeg", "svg", "avif", "auto"],
    urlPath: "/assets/images/",
    outputDir: "./dist/assets/images/",
    svgAllowUpscale: true,
    // Maximum compression settings for lossless formats.
    sharpOptions: {
      png: { compressionLevel: 9 }, // Maximum PNG compression.
    },
  };

  // Generate images, while this is async we don’t wait.
  Image(src, options);

  let imageAttributes = {
    class: cls,
    alt,
    sizes,
    loading: loading,
    decoding: "async",
  };
  // Get metadata even if the images are not fully generated.
  try {
    metadata = Image.statsSync(src, options);
  }
  // Online images don't get a resolution ahead of time.
  // Hardcode them to the largest dimensions we generate.
  catch(error) {
    metadata = Image.statsByDimensionsSync(src, 1856, 1856, options);
  }
  return Image.generateHTML(metadata, imageAttributes);
}

module.exports = function (value, outputPath) {
  if (outputPath.endsWith('.html')) {
    const DOM = new JSDOM(value, {
      resources: 'usable'
    });

    const document = DOM.window.document;
    const articleImages = [...document.querySelectorAll('main article img, .intro img')];
    const articleHeadings = [
      ...document.querySelectorAll('main article h2, main article h3')
    ];
    const articleEmbeds = [...document.querySelectorAll('main article iframe')];

    if (articleImages.length) {
      var firstImage = true;
      articleImages.forEach(image => {
        // Do nothing for data URIs.
        if(image.getAttribute('src').startsWith("data:")) {
          return;
        }
        // Do nothing for images with a specified class.
        if(image.getAttribute('class')) {
          return;
        }
        var file = "";
        if (image.getAttribute('src').charAt(0) == '/') {
          file += "./src";
        }
        file += image.getAttribute('src');
        const alt = image.getAttribute('alt');

        // Images are clickable and go to full resolution versions.
        const a = document.createElement('a');
        a.setAttribute("href", image.getAttribute('src'))
        a.setAttribute("class", "img")
        a.setAttribute("title", "Click to view full-size")
        // The first image is loaded eagerly. All others load lazily.
        if (firstImage) {
          a.innerHTML = imageShortcode(file, "", alt, loading = "eager");
          firstImage = false;
        }
        else {
          a.innerHTML = imageShortcode(file, "", alt, loading = "lazy");
        }

        // If an image has a title it means that the user added a caption,
        // so replace the image with a figure containing that image and a caption.
        if (image.hasAttribute('title')) {
          const figure = document.createElement('figure');
          figure.appendChild(a)

          const figCaption = document.createElement('figcaption');
          figCaption.innerHTML = image.getAttribute('title');
          figure.appendChild(figCaption);

          image.replaceWith(figure);
        }
        else {
          image.replaceWith(a);
        }
      });
    }

    if (articleHeadings.length) {
      // Loop each heading and add a little anchor and an ID to each one
      articleHeadings.forEach(heading => {
        const headingSlug = slugify(heading.textContent.toLowerCase());
        const anchor = document.createElement('a');

        anchor.setAttribute('href', `#heading-${headingSlug}`);
        anchor.classList.add('heading-permalink');
        anchor.innerHTML = minify(`
        <span class="visually-hidden"> permalink</span>
        <svg fill="currentColor" aria-hidden="true" focusable="false" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M9.199 13.599a5.99 5.99 0 0 0 3.949 2.345 5.987 5.987 0 0 0 5.105-1.702l2.995-2.994a5.992 5.992 0 0 0 1.695-4.285 5.976 5.976 0 0 0-1.831-4.211 5.99 5.99 0 0 0-6.431-1.242 6.003 6.003 0 0 0-1.905 1.24l-1.731 1.721a.999.999 0 1 0 1.41 1.418l1.709-1.699a3.985 3.985 0 0 1 2.761-1.123 3.975 3.975 0 0 1 2.799 1.122 3.997 3.997 0 0 1 .111 5.644l-3.005 3.006a3.982 3.982 0 0 1-3.395 1.126 3.987 3.987 0 0 1-2.632-1.563A1 1 0 0 0 9.201 13.6zm5.602-3.198a5.99 5.99 0 0 0-3.949-2.345 5.987 5.987 0 0 0-5.105 1.702l-2.995 2.994a5.992 5.992 0 0 0-1.695 4.285 5.976 5.976 0 0 0 1.831 4.211 5.99 5.99 0 0 0 6.431 1.242 6.003 6.003 0 0 0 1.905-1.24l1.723-1.723a.999.999 0 1 0-1.414-1.414L9.836 19.81a3.985 3.985 0 0 1-2.761 1.123 3.975 3.975 0 0 1-2.799-1.122 3.997 3.997 0 0 1-.111-5.644l3.005-3.006a3.982 3.982 0 0 1 3.395-1.126 3.987 3.987 0 0 1 2.632 1.563 1 1 0 0 0 1.602-1.198z"/>
        </svg>`);

        heading.setAttribute('id', `heading-${headingSlug}`);
        heading.appendChild(anchor);
      });
    }

    // Look for videos and wrap them in a container element
    if (articleEmbeds.length) {
      articleEmbeds.forEach(embed => {
        if (embed.hasAttribute('allowfullscreen')) {
          const player = document.createElement('div');

          player.classList.add('video-player');

          player.appendChild(embed.cloneNode(true));

          embed.replaceWith(player);
        }
      });
    }

    return '<!DOCTYPE html>\r\n' + document.documentElement.outerHTML;
  }
  return value;
};
