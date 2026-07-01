import type { NextConfig } from "next";
import path from "path";

/** SnapMart lives in a subfolder; parent D:\\Neev has another lockfile — pin root here */
const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  serverExternalPackages: ["@xenova/transformers", "onnxruntime-node", "sharp"],
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "res.cloudinary.com" },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        sharp$: false,
        "onnxruntime-node$": false,
      };
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^onnxruntime-node$|^node:/,
        })
      );
    }
    return config;
  },
};

export default nextConfig;
