self.addEventListener('push', function(event) {
  const options = {
    body: 'New bakery order received!',
    icon: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification('K.T.M Bakery', options)
  );
});
