const fetch = globalThis.fetch;
(async () => {
  try {
    const id = 'a9a3a895-723c-4cfd-87e1-67999f8b407a';
    const removedUrl = 'http://localhost:4566/saree-gallery-gallery/gallery1-1782327701951.png';
    const data = new FormData();
    data.append('removedGalleryImageUrls', removedUrl);

    const res = await fetch(`http://localhost:3000/api/sarees/${id}`, {
      method: 'PUT',
      headers: {
        cookie: 'saree_admin_session=saree-gallery-admin-auth'
      },
      body: data,
    });
    console.log('status', res.status);
    console.log(await res.text());
  } catch (err) {
    console.error('error', err);
    process.exit(1);
  }
})();
