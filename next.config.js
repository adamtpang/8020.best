module.exports = {
  async rewrites() {
    return {
      fallback: [
        {
          source: '/:path*',
          destination: '/',
        },
      ],
    }
  },
}