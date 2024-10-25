import path from "path";
import fs from "fs/promises";
import { globSync } from "glob";
import { fileURLToPath } from "node:url";
import { rollup } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";

(async () => {
  /** @type {import('rollup').RollupBuild | undefined} */
  let bundle;

  try {
    await fs.rm(`./esm`, {
      recursive: true,
      force: true,
    });

    await fs.rm(`./iife`, {
      recursive: true,
      force: true,
    });
  } catch (_) {}

  const filesMap = Object.fromEntries(
    globSync("ts/**/*.ts").map((file) => [
      path.relative(
        "ts",
        file.slice(0, file.length - path.extname(file).length)
      ),
      fileURLToPath(new URL(file, import.meta.url)),
    ])
  );

  /** @type {import('rollup').RollupOptions} */
  let inputOptions = {
    input: filesMap,
    plugins: [
      nodeResolve({ extensions: [".ts"] }),
      typescript({
        declaration: false,
        declarationDir: undefined,
        removeComments: true,
      }),
    ],
  };

  /** @type {import('rollup').OutputOptions[]} */
  const outputs = [
    {
      format: "esm",
      entryFileNames: "[name].js",
      dir: "esm",
      preserveModules: true,
      entryFileNames: (chunkInfo) => {
        if (chunkInfo.name.startsWith("ts/")) {
          return chunkInfo.name.replace("ts/", "") + ".js";
        }

        if (chunkInfo.name.includes("node_modules")) {
          return chunkInfo.name.replace("node_modules", "external") + ".js";
        }

        return "[name].js";
      },
    },
  ];

  try {
    bundle = await rollup(inputOptions);
    await Promise.all(outputs.map((output) => bundle.write(output)));
  } catch (error) {
    console.error(error);
  }

  if (bundle) {
    await bundle.close();
  }

  // IIFE BUILD
  const files = Object.values(filesMap);

  for (let file of files) {
    const inputOptions = {
      input: file,
      plugins: [
        nodeResolve({ extensions: [".ts"] }),
        typescript({
          declaration: false,
          declarationDir: undefined,
          removeComments: true,
        }),
      ],
      external: ["welpodron.core"],
    };
    try {
      bundle = await rollup(inputOptions);
      await bundle.write({
        format: "iife",
        name: "window.welpodron",
        extend: true,
        file: path.format({
          ...path.parse(file.replace(/ts/, "iife")),
          base: "",
          ext: "js",
        }),
        globals: { "welpodron.core": "window.welpodron" },
      });
    } catch (error) {
      console.error(error);
    }
    if (bundle) {
      await bundle.close();
    }
  }
})();
