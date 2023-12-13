'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"version.json": "421ec4e210bdd011349c630ce0aee01a",
"index.html": "ea3c5ec75876613eb5c3e4226d4a010d",
"/": "ea3c5ec75876613eb5c3e4226d4a010d",
"main.dart.js": "2159ae2b5eedb4946d877a5e30d56acf",
"flutter.js": "6fef97aeca90b426343ba6c5c9dc5d4a",
"favicon.png": "d9b39e9a372b9ee6bf86e4a3d9869610",
"icons/Icon-192.png": "ffbe9d2d6f1fe0aa3f48a012be13cce4",
"icons/Icon-maskable-192.png": "ffbe9d2d6f1fe0aa3f48a012be13cce4",
"icons/Icon-maskable-512.png": "fd216239f11915571f4649c631e11a6f",
"icons/Icon-512.png": "fd216239f11915571f4649c631e11a6f",
"manifest.json": "a0edbd3d99e5aa6c94d5e9a76d77c4a2",
"assets/AssetManifest.json": "5ac7529ccbfdb5f697439e16ded8f778",
"assets/NOTICES": "ab2aa45790c9db1feee70b73016b3f91",
"assets/FontManifest.json": "0102f7db034a27ac2e161fb782e51e34",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "57d849d738900cfd590e9adc7e208250",
"assets/shaders/ink_sparkle.frag": "f8b80e740d33eb157090be4e995febdf",
"assets/AssetManifest.smcbin": "b2b983bd326d1e232f32973adcf381cc",
"assets/fonts/MaterialIcons-Regular.otf": "79906f47a6c9c29c423d2eac5a45bc0a",
"assets/assets/imgs/gcloud.svg": "e74e2ce182c10d0a87d94e80e5f1e90e",
"assets/assets/imgs/gcloud.png": "2db9f8ddfd1bdcea940dfc42257bc853",
"assets/assets/imgs/gcloud1c.svg": "8dd5ae8e4b91026913be802c616cc0cd",
"assets/assets/imgs/gcloudmono.svg": "b7499201153636a0b0de5554a140cf83",
"assets/assets/imgs/gcloud2c.svg": "4c959fb25c6d4efd119d1647aeabbe2a",
"assets/assets/imgs/flutterlogo.png": "43b437d2fc2c13c5edda6b36ad95a2b6",
"assets/assets/imgs/gcloud3c.svg": "04d9492ca81bfe5191a6f49006e4e60c",
"assets/assets/imgs/gcloud4.svg": "6897583cba12a44f6e2781c93ae9646b",
"assets/assets/imgs/gcloud4c.svg": "fed7df906ac61b19966aab39c1d9176b",
"assets/assets/imgs/gcloud2.svg": "19440c8de4c41dddb1af76f852e4e317",
"assets/assets/imgs/gcloud3.svg": "2564e5786128b910d6c0165cd3117def",
"assets/assets/imgs/flutterlogo.svg": "55797ebf50e61c6b512989d016a86f58",
"assets/assets/imgs/gcloud1.svg": "39a2de9415fc9dd55fe33b2a13588625",
"assets/assets/config/badgeconfig.json": "60bbc9e5c0f46d2a7feae274fe28c914",
"assets/assets/fonts/Product%2520Sans%2520Regular.ttf": "eae9c18cee82a8a1a52e654911f8fe83",
"launch_img.png": "46e7bdfaa24d4caea84bff9a2e02918e",
"canvaskit/skwasm.js": "1df4d741f441fa1a4d10530ced463ef8",
"canvaskit/skwasm.wasm": "6711032e17bf49924b2b001cef0d3ea3",
"canvaskit/chromium/canvaskit.js": "8c8392ce4a4364cbb240aa09b5652e05",
"canvaskit/chromium/canvaskit.wasm": "fc18c3010856029414b70cae1afc5cd9",
"canvaskit/canvaskit.js": "76f7d822f42397160c5dfc69cbc9b2de",
"canvaskit/canvaskit.wasm": "f48eaf57cada79163ec6dec7929486ea",
"canvaskit/skwasm.worker.js": "19659053a277272607529ef87acf9d8a"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
