import livereload from "rollup-plugin-livereload";
import serve from "rollup-plugin-serve";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import * as meta from "./package.json";

export default {
  input: "src/ELive.js",
  output: [
    {
      file: "dist/ELive.js",
      format: "umd",
      name: "ELive",
      sourcemap: true,
      intro: `const __VERSION__ = "${meta.version}-dev"; const __ENV__="dev";`
    },
    {
      file: "dist/ELive.mjs",
      format: "es",
      sourcemap: true,
      intro: `const __VERSION__ = "${meta.version}-dev"; const __ENV__="dev";`
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
    serve({
      contentBase: ["dist", "public"],
      port: 9099
    }),
    livereload("dist")
  ]
};
