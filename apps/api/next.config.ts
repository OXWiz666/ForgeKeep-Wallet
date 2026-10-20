import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@forgekeep/validators"],
  webpack(config) {
    // Shared NodeNext packages use .js specifiers for their TypeScript sources.
    config.resolve.extensionAlias = { ...config.resolve.extensionAlias, ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
};

export default config;
