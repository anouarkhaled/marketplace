export function mergeMessages(previous, incoming) {
  const messages = new Map(previous.map((message) => [message.id, message]));
  incoming.forEach((message) => messages.set(message.id, message));
  return [...messages.values()].sort((a, b) =>
    new Date(a.created_at) - new Date(b.created_at) || a.id - b.id
  );
}

export async function fetchRecentMessages(client, path, knownIds, { signal, initial = false } = {}) {
  const messages = [];
  let page = 1;
  let response;
  do {
    response = await client.get(path, { params: { page }, signal });
    const batch = response.data.results || response.data;
    messages.push(...batch);
    if (initial || batch.some((message) => knownIds.has(message.id))) break;
    page += 1;
  } while (response.data.next && !signal?.aborted);
  return { messages, hasOlder: Boolean(response.data.next) };
}
