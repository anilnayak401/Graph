const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Inject global Buffer and process polyfills for Edge & Cloudflare runtimes
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process',
      })
    );

    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/'),
    };

    return config;
  },
};

module.exports = nextConfig;
