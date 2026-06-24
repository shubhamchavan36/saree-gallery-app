(async () => {
  try {
    const id = '4de9ee9d-df8c-4a73-a6a0-20651ca18a42';
    const removedUrl = 'http://localhost:4566/saree-gallery-gallery/img_1403-photoroom-1782328086431.PNG';
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
