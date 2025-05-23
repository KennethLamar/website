# Kenneth Lamar's website

My website, based on Hylia, a lightweight [Eleventy](https://11ty.io) starter kit.

---

## Terminal commands

### Ensure packages are installed and up to date

```bash
npm install 
```

### Serve the site locally

```bash
npm start
```

### Build a production version of the site

```bash
npm run production
```

### Compile Sass

```bash
npm run sass:process
```

### Re-generate design tokens for Sass

```bash
npm run sass:tokens
```

## Design Tokens and Styleguide

### Design Tokens

Although Hylia has a pretty simple design, you can configure the core design tokens that control the colours, size ratio and fonts.

---

**Note**: _Credit must be given to the hard work [Jina Anne](https://twitter.com/jina) did in order for the concept of design tokens to even exist. You should watch [this video](https://www.youtube.com/watch?v=wDBEc3dJJV8), then [read this article](https://the-pastry-box-project.net/jina-bolton/2015-march-28) and then sign up for [this course](https://aycl.uie.com/virtual_seminars/design_tokens_scaling_design_with_a_single_source_of_truth) to expand your knowledge._

---

To change the design tokens in the CMS, find the “Globals” in the sidebar then in the presented options, select “Theme Settings”.

To change the design tokens directly, edit [`_src/data/tokens.json`](https://github.com/KennethLamar/website/tree/master/src/_data/tokens.json).

The tokens are converted into maps that the Sass uses to compile the front-end CSS, so make sure that you maintain the correct structure of `tokens.json`.

### Styleguide

Your version of Hylia ships with a Styleguide by default. You can see a demo of the Styleguide at <https://kennethmlamar.com/styleguide/>.

You can edit the Styleguide by opening [`src/styleguide.njk`](https://github.com/KennethLamar/website/tree/master/src/styleguide.njk). If you don’t want the Styleguide, delete that file and the page will vanish.

## Sass

Hylia is based on the [WIP v2 version of Stalfos](https://github.com/hankchizljaw/stalfos/tree/feature/v2), which currently has no documentation (I know, I’m bad). Here is some very basic documentation for elements of the new framework that you will encounter on this project.

### Configuration

The whole Sass system is powered by central config file, which lives here: [`_src/scss/_config.scss`](https://github.com/KennethLamar/website/tree/master/src/scss/_config.scss).

Before Sass is compiled, a `_tokens.scss` file is generated from the [design tokens config](https://github.com/KennethLamar/website/tree/master/src/_data/tokens.json) which is required.

Key elements:

- `$stalfos-size-scale`: A token driven size scale which by default, is a “Major Third” scale
- `$stalfos-colors`: A token driven map of colours
- `$stalfos-util-prefix`: All pre-built, framework utilities will have this prefix. Example: the wrapper utility is '.sf-wrapper' because the default prefix is 'sf-'
- `$metrics`: Various misc metrics to use around the site
- `$stalfos-config`: This powers everything from utility class generation to breakpoints to enabling/disabling pre-built components/utilities

### How to create a new utility class with the generator

The utility class generator lets you generate whatever you want, with no opinions on class name or properties affected.

To add a new class, add another item to the exists `$stalfos-config` map. This example adds a utility for floating elements.

```scss
'float':('items':('left':'left','right': 'right'
  ),
  'output': 'responsive',
  'property': 'float'
);
```

The `output` is set to `responsive` which means every breakpoint will generate a prefixed class for itself. If you only wanted elements to float left in the `md` breakpoint, you’d now be able to add a class of `md:float-left` to your HTML elements.

If you only want standard utility classes generating, set the `output` to `standard`.

### Functions

#### `get-color($key)`

Function tries to match the passed `$key` with the `$stalfos-colors` map. Returns null if it can’t find a match.

#### `get-config-value($key, $group)`

Returns back a 1 dimensional (key value pair) config value if available.

#### `get-size($ratio-key)`

Function tries to match the passed `$ratio-key` with the `$stalfos-size-scale`. Returns null if it can’t find a match.

### Mixins

#### `apply-utility($key, $value-key)`

Grabs the property and value of one of the `$stalfos-config utilities` that the generator will generate a class for.

#### `media-query($key)`

Pass in the key of one of your breakpoints set in `$stalfos-config['breakpoints']` and this mixin will generate the `@media` query with your configured value.
