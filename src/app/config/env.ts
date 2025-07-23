export const config = {
    urls: {
      //JWT endpoints
      logIn: 'http://localhost:3001/login',
      register: 'http://localhost:3001/register',
      refreshAccessToken: 'http://localhost:3001/refresh-token',
  
      //Delivery endpoints
      getDelivery: 'http://localhost:3000/delivery',
      getDeliveryByProximity: 'http://localhost:3000/delivery/findByProximity',
      getDeliveryById: (id: number) => `http://localhost:3000/delivery/${id}`,
      createDelivery: 'http://localhost:3000/delivery',
      deleteDelivery: (id:number) =>`http://localhost:3000/delivery/${id}`,
      updateLocation: (id: number) => `http://localhost:3000/delivery/${id}/location`,
      updateStatus: (id: number) => `http://localhost:3000/delivery/${id}/status`,
      getDeliveryByZone: 'http://localhost:3000/delivery/findByZone',

      //Zone endpoints
      getZones: 'http://localhost:3000/zones',
      getZoneById: (id: number) => `http://localhost:3000/zones/${id}`,
      createZone: 'http://localhost:3000/zones',
      updateZone: (id: number) => `http://localhost:3000/zones/${id}`,
      deleteZone: (id: number) => `http://localhost:3000/zones/${id}`,
    },
  }
