export async function fetchAllPages(client, path, signal) {
  const items = [];
  let page = 1;
  let response;
  do {
    response = await client.get(path, { params: { page }, signal });
    items.push(...(response.data.results || response.data));
    page += 1;
  } while (response.data.next);
  return items;
}
