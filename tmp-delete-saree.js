(async () => {
  try {
    const id = '4de9ee9d-df8c-4a73-a6a0-20651ca18a42';
    const res = await fetch(`http://localhost:3000/api/sarees/${id}`, {
      method: 'DELETE',
      headers: { cookie: 'saree_admin_session=saree-gallery-admin-auth' }
    });
    console.log('status', res.status);
    console.log(await res.text());
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
