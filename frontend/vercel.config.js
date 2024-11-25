module.exports = {
  routes: [
    {
      src: '/app',
      dest: '/'
    },
    {
      src: '/app/(.*)',
      dest: '/'
    },
    {
      handle: 'filesystem'
    },
    {
      src: '/(.*)',
      dest: '/'
    }
  ],
  rewrites: [
    {
      source: '/(.*)',
      destination: '/'
    }
  ]
}