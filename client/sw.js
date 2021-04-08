var version = 'v0.0.1';
var rules = [
   new RegExp('/js/.*'),
   new RegExp('/css/.*'),
   new RegExp('/images/.*'),
   new RegExp('/icon.png')
];

self.addEventListener('activate', function (event) {
   var cacheKeeplist = [version];
   event.waitUntil(
      caches.keys().then(function (keyList) {
         return Promise.all(keyList.map(function (key) {
            if (cacheKeeplist.indexOf(key) < 0) {
               return caches.delete(key);
            }
         }));
      })
   );
});

self.addEventListener('fetch', function (event) {
   event.respondWith(
      caches.match(event.request).then(function (response) {
         return response || fetch(event.request).then(function (netres) {
            var path = '/' + event.request.url.split('/').slice(3).join('/');
            var match = false;
            for (var i = 0, n = rules.length; i < n; i++) {
               if (rules[i].test(path)) {
                  match = true;
                  break;
               }
            }
            if (!match) return netres;
            return caches.open(version).then(function (cache) {
               cache.put(event.request, netres.clone());
               return netres;
            }); // caches.open
         }); // fetch
      }) // caches.match
   );
});

/* // add below code to for example index.html to enable service worker
if ('serviceWorker' in window.navigator) {
   window.navigator.serviceWorker.getRegistrations().then(function (sws) {
      cache();
      if (sws.length === 0) {
         window.pianoInitialize(true);
      } else {
         window.pianoInitialize(false);
      }

      function cache() {
         window.navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(
            function () {
               console.log('service worker is ready ...');
            }, function (err) {
               console.error('service worker:', err);
            }
         );
      }
   }, function () {
      // init app
   });
} else {
   // init app without service worker
}
*/
