// app.js
// - UI behaviors (year, smooth scrolling, info toggle)
// - Watson Assistant on-demand loader and floating chat opener
// NOTE: This file intentionally contains the Watson loader logic so the chat is injected only when requested.

document.addEventListener('DOMContentLoaded', function () {
  // footer year
  const y = new Date().getFullYear();
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = y;

  // smooth anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      const id = this.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Info toggle
  const openInfo = document.getElementById('open-info');
  if (openInfo) {
    openInfo.addEventListener('click', function () {
      const learn = document.getElementById('learn');
      if (!learn) return;
      const isHidden = learn.style.display === 'none';
      learn.style.display = isHidden ? 'block' : 'none';
      if (!isHidden) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        openInfo.setAttribute('aria-expanded', 'false');
      } else {
        learn.scrollIntoView({ behavior: 'smooth', block: 'start' });
        openInfo.setAttribute('aria-expanded', 'true');
      }
    });
  }

  // Chat open button - loads Watson Assistant on demand and opens the floating chat
  const cta = document.getElementById('cta-open-chat');
  if (cta) {
    cta.addEventListener('click', async function () {
      showChatHint();

      // If assistant instance exists, try to open/focus it.
      if (window.watsonAssistant && typeof window.watsonAssistant.open === 'function') {
        try {
          window.watsonAssistant.open();
          cta.setAttribute('aria-expanded', 'true');
          return;
        } catch (e) {
          // ignore and try to render again
        }
      }

      // Prevent multiple injections while loading
      if (window.__watsonLoading) return;
      window.__watsonLoading = true;

      // Prepare options for Watson widget and keep instance accessible
      window.watsonAssistantChatOptions = {
        integrationID: "f73706b5-b02f-4bd9-a004-a977d16e416e", // The ID of this integration.
        region: "us-south", // The region your integration is hosted in.
        serviceInstanceID: "c7999f56-b52a-4369-abae-a480c37a425a", // The ID of your service instance.
        onLoad: async (instance) => {
          window.watsonAssistant = instance;
          try {
            await instance.render(); // renders the floating interface / bubble
            // attempt to open the chat window if the API supports it
            if (typeof instance.open === 'function') {
              try { instance.open(); } catch (e) { /* ignore */ }
            }
            cta.setAttribute('aria-expanded', 'true');
          } catch (err) {
            console.error('Watson Assistant render error:', err);
            alert('Failed to render the chat widget. Check console for details.');
          } finally {
            // clear loading flag
            window.__watsonLoading = false;
          }
        }
      };

      // Inject the Watson web chat script
      const s = document.createElement('script');
      s.src = "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" + (window.watsonAssistantChatOptions.clientVersion || 'latest') + "/WatsonAssistantChatEntry.js";
      s.async = true;
      s.onload = () => {
        // onLoad handler in the options will manage instance setup
      };
      s.onerror = () => {
        window.__watsonLoading = false;
        console.error('Failed to load Watson Assistant script.');
        alert('Failed to load chat widget. Check console for errors.');
      };
      document.head.appendChild(s);
    });
  }

  // show ephemeral hint pointing to bottom-right
  function showChatHint() {
    if (document.getElementById('cw-chat-hint')) return;
    const el = document.createElement('div');
    el.id = 'cw-chat-hint';
    el.style.position = 'fixed';
    el.style.right = '20px';
    el.style.bottom = '120px';
    el.style.zIndex = 999999;
    el.style.background = 'linear-gradient(90deg,#00c2a8,#35d6c2)';
    el.style.color = '#042027';
    el.style.padding = '10px 14px';
    el.style.borderRadius = '12px';
    el.style.fontWeight = 700;
    el.style.boxShadow = '0 10px 30px rgba(2,6,23,0.6)';
    el.textContent = 'Opening chat →';
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .4s ease, transform .4s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-12px)';
    }, 1400);
    setTimeout(() => el.remove(), 2100);
  }
});