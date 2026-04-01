// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyAEqx07BEhQSUF3VYiK5m1oITnkmzkeWA4',
  authDomain: 'turnapp-e9c58.firebaseapp.com',
  projectId: 'turnapp-e9c58',
  storageBucket: 'turnapp-e9c58.firebasestorage.app',
  messagingSenderId: '618072826022',
  appId: '1:618072826022:web:28133c531c68176c255467',
})

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  const { title, body, icon } = payload.notification || {}
  self.registration.showNotification(title || 'TurnApp', {
    body: body || 'Es tu turno',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'turnapp-ticket',
    renotify: true,
    data: payload.data,
  })
})

// Click on notification → focus/open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
