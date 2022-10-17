import builtins from '@erquhart/rollup-plugin-node-builtins'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'

export default {
  input: 'src/admin/util',
  output: {
    file: 'dist/admin/util.js',
    format: 'iife',
    name: 'previewUtil',
  },
  plugins: [
    builtins(),
    nodeResolve(),
    commonjs(),
    json(),
  ]
};
