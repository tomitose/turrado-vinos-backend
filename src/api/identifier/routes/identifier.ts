export default {
  routes: [
    {
      method: 'POST',
      path: '/identifier/identify-image',
      handler: 'identifier.identifyImage',
      config: {
        auth: false, // Hacemos que la ruta sea pública
      },
    },
  ],
};