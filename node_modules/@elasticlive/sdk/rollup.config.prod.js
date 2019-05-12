import { terser } from "rollup-plugin-terser";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import * as meta from "./package.json";

const copyright = `// ${meta.homepage} v${
  meta.version
} Copyright ${new Date().getFullYear()} ${meta.author.name}`;

export default [
  {
    input: "src/ELive.js",
    output: [
      {
        format: "umd",
        file: "dist/ELive.min.js",
        name: "ELive",
        intro: `const __VERSION__ = "${meta.version}"; const __ENV__="prod"`
      },
      {
        format: "es",
        file: "dist/ELive.min.mjs",
        intro: `const __VERSION__ = "${meta.version}"; const __ENV__="prod"`
      }
    ],
    plugins: [
      resolve({
        // FIXME: https://github.com/rollup/rollup-plugin-node-resolve/issues/196
        preferBuiltins: false
      }),
      commonjs({
        include: "node_modules/**"
      }),
      terser({ output: { preamble: copyright } })
    ]
  },
  {
    input: "src/ELive.js",
    output: [
      {
        format: "umd",
        file: "dist/ELive.js",
        name: "ELive",
        banner: copyright,
        intro: `const __VERSION__ = "${meta.version}"; const __ENV__="prod"`
      },
      {
        format: "es",
        file: "dist/ELive.mjs",
        banner: copyright,
        intro: `const __ELIVE_VERSION__ = "${meta.version};"`
      }
    ],
    plugins: [
      resolve({
        // FIXME: https://github.com/rollup/rollup-plugin-node-resolve/issues/196
        preferBuiltins: false
      }),
      commonjs({
        include: "node_modules/**"
      })
    ]
  }
];
