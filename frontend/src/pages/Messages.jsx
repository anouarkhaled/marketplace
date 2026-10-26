import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { mediaUrl } from "../services/media";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { extractErrorMessage } from "../services/errors";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icons";
import RequestError from "../components/RequestError";
import { fetchRecentMessages, mergeMessages } from "../services/messages";

function timeAgo(dateStr) {
  const diff = (new Date() - new Date(dateStr)) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return new Date(dateStr).toLocaleDateString();
}

function Messages() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationPage, setConversationPage] = useState(1);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [listError, setListError] = useState(null);
  const [threadError, setThreadError] = useState(null);
  const [threadVersion, setThreadVersion] = useState(0);
  const [threadConversation, setThreadConversation] = useState(null);
  const threadPanel = useRef(null);
  const restoreScroll = useRef(null);
  const openedConversation = useRef(null);
  const selectedConversation = useRef(conversationId);
  selectedConversation.current = conversationId;
  const scrollToLatest = useRef(true);
  const conversationPageRef = useRef(1);
  const knownMessageIds = useRef(new Set());
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const loadConversations = useCallback(async (page = 1) => {
    setListError(null);
    setLoadingMoreConversations(true);
    try {
      const res = await api.get("/conversations/", { params: { page } });
      const incoming = res.data.results || res.data;
      setConversations((previous) => {
        const combined = new Map(previous.map((item) => [item.id, item]));
        incoming.forEach((item) => combined.set(item.id, item));
        return [...combined.values()];
      });
      if (page !== 1 || conversationPageRef.current === 1) {
        conversationPageRef.current = page;
        setConversationPage(page);
        setHasMoreConversations(Boolean(res.data.next));
      }
    } catch (err) {
      setListError(extractErrorMessage(err, "Chargement des conversations impossible."));
    } finally {
      setLoadingList(false);
      setLoadingMoreConversations(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (openedConversation.current !== conversationId) {
      setMessages([]);
      setBody("");
      openedConversation.current = conversationId;
    }
    setMessagePage(1);
    setHasOlderMessages(false);
    setLoadingOlder(false);
    restoreScroll.current = null;
    setThreadError(null);
    setThreadConversation(null);
    knownMessageIds.current = new Set();
    if (!conversationId) return;
    const controller = new AbortController();
    let refreshing = false;
    setLoadingThread(true);
    scrollToLatest.current = true;
    api.get(`/conversations/${conversationId}/`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setThreadConversation(data); })
      .catch(() => {});
    const refreshMessages = async (initial = false) => {
      if (refreshing) return;
      refreshing = true;
      try {
        const { messages: incoming, hasOlder } = await fetchRecentMessages(
          api, `/conversations/${conversationId}/messages/`, knownMessageIds.current,
          { initial, signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        setThreadError(null);
        incoming.forEach((message) => knownMessageIds.current.add(message.id));
        setMessages((previous) => mergeMessages(previous, incoming));
        if (initial) setHasOlderMessages(hasOlder);
      } catch (err) {
        if (!controller.signal.aborted) setThreadError(extractErrorMessage(err, "Conversation introuvable."));
      } finally {
        refreshing = false;
        if (!controller.signal.aborted) setLoadingThread(false);
      }
    };
    refreshMessages(true);

    const interval = setInterval(() => refreshMessages(), 8000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [conversationId, threadVersion]);

  useLayoutEffect(() => {
    const panel = threadPanel.current;
    if (!panel) return;
    if (restoreScroll.current) {
      panel.scrollTop = restoreScroll.current.top + panel.scrollHeight - restoreScroll.current.height;
      restoreScroll.current = null;
    } else if (scrollToLatest.current) panel.scrollTop = panel.scrollHeight;
  }, [messages, loadingList, loadingThread]);

  const loadOlderMessages = async () => {
    if (loadingOlder) return;
    const target = conversationId;
    setLoadingOlder(true);
    scrollToLatest.current = false;
    try {
      const res = await api.get(`/conversations/${target}/messages/`, { params: { page: messagePage + 1 } });
      if (selectedConversation.current !== target) return;
      const panel = threadPanel.current;
      if (panel) restoreScroll.current = { top: panel.scrollTop, height: panel.scrollHeight };
      (res.data.results || res.data).forEach((message) => knownMessageIds.current.add(message.id));
      setMessages((previous) => mergeMessages(previous, res.data.results || res.data));
      setMessagePage((page) => page + 1);
      setHasOlderMessages(Boolean(res.data.next));
    } catch (err) {
      if (selectedConversation.current === target) toast.error(extractErrorMessage(err, "Chargement des anciens messages impossible."));
    } finally {
      if (selectedConversation.current === target) setLoadingOlder(false);
    }
  };

  const activeConversation = threadConversation || conversations.find((c) => String(c.id) === conversationId);

  const partnerOf = (conversation) => {
    if (!conversation || !user) return null;
    return conversation.buyer.id === user.id ? conversation.seller : conversation.buyer;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!body.trim() || sending) return;
    const target = conversationId;
    setSending(true);
    try {
      const res = await api.post(`/conversations/${conversationId}/messages/`, { body: body.trim() });
      if (selectedConversation.current === target) {
        scrollToLatest.current = true;
        setMessages((previous) => mergeMessages(previous, [res.data]));
        setBody("");
      }
      loadConversations();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Envoi impossible."));
    } finally {
      setSending(false);
    }
  };

  if (loadingList) return <Spinner size="lg" />;
  if (listError && !conversations.length && !conversationId) return <div className="container page"><h1>Messagerie</h1>
    <RequestError message={listError} onRetry={() => loadConversations()} /></div>;

  return (
    <div className="container page">
      <div className="page-header">
        <h1>Messagerie intégrée</h1>
        <p>Retrouvez vos échanges avec les acheteurs et les vendeurs.</p>
      </div>

      {listError && <RequestError message={listError} onRetry={() => loadConversations()} />}
      {!listError && conversations.length === 0 && !conversationId ? (
        <EmptyState
          icon="message"
          title="Aucune conversation pour le moment"
          description="Consultez une annonce et cliquez sur 'Contacter le vendeur' pour démarrer une discussion."
          action={<Link to="/annonces" className="btn btn-primary"><Icon name="search" size={18} /> Parcourir les annonces</Link>}
        />
      ) : (
        <div className={`messages-layout card${conversationId ? " show-thread" : ""}`}>
          <div className="conversation-list">
            {conversations.map((c) => {
              const partner = partnerOf(c);
              return (
                <Link
                  key={c.id}
                  to={`/messages/${c.id}`}
                  className={`conversation-item${String(c.id) === conversationId ? " active" : ""}`}
                >
                  {c.listing_image ? (
                    <img src={mediaUrl(c.listing_image)} alt="" />
                  ) : (
                    <Avatar name={partner?.username} size={48} />
                  )}
                  <div className="meta">
                    <div className="title-row">
                      <span>{partner?.username}</span>
                      {c.unread_count > 0 && <span className="badge badge-primary">{c.unread_count}</span>}
                    </div>
                    <div className="preview" style={{ fontWeight: 600, color: "var(--text-h)" }}>{c.listing_title}</div>
                    {c.last_message && <div className="preview">{c.last_message.body}</div>}
                  </div>
                </Link>
              );
            })}
            {hasMoreConversations && (
              <button className="btn btn-ghost btn-block" disabled={loadingMoreConversations}
                onClick={() => loadConversations(conversationPage + 1)}>
                {loadingMoreConversations ? "Chargement..." : "Voir plus de conversations"}
              </button>
            )}
          </div>

          <div className="conversation-thread">
            {!conversationId ? (
              <EmptyState
                icon="message"
                title="Sélectionnez une discussion"
                description="Choisissez une conversation dans le panneau de gauche pour afficher les messages."
              />
            ) : loadingThread ? (
              <Spinner size="lg" />
            ) : threadError ? (
              <div className="card-pad"><RequestError message={threadError} onRetry={() => setThreadVersion((value) => value + 1)} />
                <button className="btn btn-ghost" onClick={() => navigate("/messages")}>Retour aux conversations</button></div>
            ) : (
              <>
                <div className="thread-header">
                  <button className="btn btn-ghost btn-sm thread-back-btn" onClick={() => navigate("/messages")}>
                    <Icon name="arrow-left" size={16} /> Retour
                  </button>
                  <Avatar src={partnerOf(activeConversation)?.avatar} name={partnerOf(activeConversation)?.username} size={38} />
                  <div>
                    <div style={{ fontWeight: 700 }}>{partnerOf(activeConversation)?.username || "Conversation"}</div>
                    {activeConversation && (
                      <Link to={`/annonce/${activeConversation.listing}`} className="muted" style={{ fontSize: "0.85rem" }}>
                        Annonce : {activeConversation.listing_title}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="thread-messages" ref={threadPanel} onScroll={(event) => {
                  const panel = event.currentTarget;
                  scrollToLatest.current = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 80;
                }}>
                  {hasOlderMessages && (
                    <button className="btn btn-ghost btn-block" onClick={loadOlderMessages} disabled={loadingOlder}>
                      {loadingOlder ? "Chargement..." : "Voir les messages précédents"}
                    </button>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className={`message-bubble${m.sender.id === user.id ? " own" : ""}`}>
                      <div>{m.body}</div>
                      <span className="time">{timeAgo(m.created_at)}</span>
                    </div>
                  ))}
                </div>

                <form className="thread-composer" onSubmit={handleSend}>
                  <textarea
                    className="textarea"
                    aria-label="Votre message"
                    maxLength={2000}
                    disabled={sending}
                    placeholder="Écrivez votre message... (Entrée pour envoyer)"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    required
                  />
                  <button type="submit" className="btn btn-primary" aria-label="Envoyer le message" disabled={sending || !body.trim()}>
                    {sending ? "..." : <Icon name="arrow-right" size={18} />}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
