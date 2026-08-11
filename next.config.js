const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Force Webpack to alias 'buffer' to the npm 'buffer/' package rather than Node stub
    config.resolve.alias = {
      ...config.resolve.alias,
      buffer: require.resolve('buffer/'),
    };

    // Inject global Buffer and process into all modules
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer/', 'Buffer'],
        process: 'process',
      })
    );

    return config;
  },
};

module.exports = nextConfig;
