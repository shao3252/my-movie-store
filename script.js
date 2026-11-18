const SUPABASE_URL = "https://rnnohvwrmwnhnbwczrpt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_pX9vsHwyUnItxBgKqKx5oQ_gCkh8kUH";

const movieGrid = document.getElementById("movieGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll(".filter-chip");
let films = [];
let activeCategory = "All";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function formatPrice(amount) {
  return new Intl.NumberFormat("sw-TZ").format(Number(amount || 0)) + " TSh";
}
function categoryName(value) {
  return ({"Drama":"Tamthilia","Action":"Vita","Comedy":"Vichekesho","Short Film":"Filamu fupi"}[value] || value || "Filamu");
}
function posterUrl(path) {
  if (!path) return "";
  return SUPABASE_URL + "/storage/v1/object/public/movie-posters/" +
    path.split("/").map(encodeURIComponent).join("/");
}
function renderFilms() {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = films.filter(film => {
    const matchesCategory = activeCategory === "All" || film.category === activeCategory;
    const matchesSearch = (film.title + " " + (film.description || "") + " " + categoryName(film.category)).toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });
  movieGrid.innerHTML = filtered.map(film => {
    const image = posterUrl(film.poster_path);
    return '<article class="movie-card">' +
      '<button class="poster-wrap poster-open" type="button" data-film="' + escapeHtml(film.id) + '" aria-label="Maelezo ya ' + escapeHtml(film.title) + '">' +
      (image ? '<img src="' + escapeHtml(image) + '" alt="Picha ya ' + escapeHtml(film.title) + '" loading="lazy">' : '<div class="poster-placeholder">MY MOVIE STORE</div>') +
      '<div class="poster-shade"></div><span class="film-label">' + escapeHtml(categoryName(film.category)) + '</span></button>' +
      '<div class="movie-info"><div class="movie-meta"><span>' + escapeHtml(film.release_year || "Mpya") + '</span><span>' +
      (film.duration_minutes ? escapeHtml(film.duration_minutes) + ' dakika' : 'Filamu') + '</span></div>' +
      '<h3>' + escapeHtml(film.title) + '</h3>' +
      '<div class="movie-bottom"><span class="price">' + formatPrice(film.price_tzs) + '</span>' +
      '<button class="buy-button" type="button" data-film="' + escapeHtml(film.id) + '">Maelezo ↗</button></div></div></article>';
  }).join("");
  emptyState.hidden = filtered.length !== 0;
  emptyState.textContent = films.length ? "Hakuna filamu iliyopatikana." : "Bado hakuna filamu zilizowekwa.";
}

async function callManualOrders(payload) {
  const response = await fetch(SUPABASE_URL + "/functions/v1/manual-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Imeshindikana kuwasiliana na mfumo wa oda.");
  return result;
}
function paymentMethodName(value) {
  return ({mpesa:"M-Pesa",airtel_money:"Airtel Money",tigo_pesa:"Tigo Pesa"}[value] || value);
}

function openFilmDetails(film) {
  let modal = document.getElementById("filmDetails");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "filmDetails";
    modal.className = "film-modal";
    modal.innerHTML = '<div class="film-modal-panel" role="dialog" aria-modal="true" aria-labelledby="detailTitle">' +
      '<button class="film-modal-close" type="button" aria-label="Funga">×</button><div id="detailContent"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener("click", event => {
      if (event.target === modal || event.target.closest(".film-modal-close")) modal.classList.remove("show");
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") modal.classList.remove("show");
    });
  }
  const image = posterUrl(film.poster_path);
  document.getElementById("detailContent").innerHTML =
    (image ? '<img class="detail-poster" src="' + escapeHtml(image) + '" alt="">' : '') +
    '<div class="detail-copy"><span class="detail-category">' + escapeHtml(categoryName(film.category)) + '</span>' +
    '<h2 id="detailTitle">' + escapeHtml(film.title) + '</h2>' +
    '<p>' + escapeHtml(film.description || "Hakuna maelezo ya ziada.") + '</p>' +
    '<div class="detail-meta">' + escapeHtml(film.release_year || "—") + ' · ' +
    (film.duration_minutes ? escapeHtml(film.duration_minutes) + ' dakika' : 'Muda haujawekwa') + '</div>' +
    '<strong class="detail-price">' + formatPrice(film.price_tzs) + '</strong>' +
    '<button class="buy-button detail-buy" id="startPurchase" type="button">Nunua filamu</button>' +
    '<div id="checkoutPanel" class="checkout-panel" hidden></div></div>';

  const checkout = document.getElementById("checkoutPanel");
  document.getElementById("startPurchase").addEventListener("click", () => {
    checkout.hidden = false;
    checkout.innerHTML =
      '<form id="checkoutForm" class="checkout-form">' +
      '<h3>Weka taarifa zako</h3>' +
      '<label>Jina lako<input name="customer_name" required minlength="2" maxlength="100" placeholder="Jina kamili"></label>' +
      '<label>Namba ya simu<input name="customer_phone" required inputmode="tel" placeholder="07XXXXXXXX au +2557XXXXXXXX"></label>' +
      '<button class="buy-button" type="submit">Endelea kulipa</button><p class="checkout-message" id="checkoutMessage"></p></form>';
    document.getElementById("startPurchase").hidden = true;

    document.getElementById("checkoutForm").addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector("button[type=submit]");
      const message = document.getElementById("checkoutMessage");
      button.disabled = true;
      button.textContent = "Inatengeneza oda…";
      message.textContent = "";
      try {
        const data = await callManualOrders({
          action: "create_order",
          movie_id: film.id,
          customer_name: form.customer_name.value.trim(),
          customer_phone: form.customer_phone.value.trim()
        });
        localStorage.setItem("mms_order_" + data.order_id, data.access_token);
        checkout.innerHTML =
          '<div class="payment-instructions"><h3>Oda yako imeundwa</h3>' +
          '<p>Namba ya oda: <strong>' + escapeHtml(data.order_id) + '</strong></p>' +
          '<p>Kiasi: <strong>' + formatPrice(data.amount_tzs) + '</strong></p>' +
          '<p>Tuma malipo kwa <strong>' + escapeHtml(paymentMethodName(data.payment.payment_method)) + '</strong> kwenye namba:</p>' +
          '<p class="payment-number">' + escapeHtml(data.payment.phone) + '</p>' +
          '<p>Jina la akaunti: <strong>' + escapeHtml(data.payment.account_name) + '</strong></p>' +
          '<p>Baada ya kutuma fedha, weka namba ya muamala hapa chini. Pakua baada ya msimamizi kuthibitisha malipo.</p>' +
          '<form id="referenceForm" class="checkout-form"><label>Namba ya muamala<input name="reference" required minlength="4" maxlength="80" placeholder="Mfano: transaction ID"></label>' +
          '<button class="buy-button" type="submit">Nimetuma malipo</button></form>' +
          '<p class="checkout-message" id="paymentMessage"></p>' +
          '<button class="buy-button check-order-button" id="checkOrderButton" type="button">Angalia hali ya oda</button></div>';

        document.getElementById("referenceForm").addEventListener("submit", async referenceEvent => {
          referenceEvent.preventDefault();
          const referenceButton = referenceEvent.currentTarget.querySelector("button");
          const referenceMessage = document.getElementById("paymentMessage");
          referenceButton.disabled = true;
          try {
            await callManualOrders({
              action: "submit_reference",
              order_id: data.order_id,
              access_token: data.access_token,
              reference: referenceEvent.currentTarget.reference.value.trim()
            });
            referenceMessage.textContent = "Namba ya muamala imepokelewa. Subiri uthibitisho wa malipo.";
          } catch (error) {
            referenceMessage.textContent = error.message;
          } finally {
            referenceButton.disabled = false;
          }
        });

        document.getElementById("checkOrderButton").addEventListener("click", async event => {
          const checkButton = event.currentTarget;
          const paymentMessage = document.getElementById("paymentMessage");
          checkButton.disabled = true;
          try {
            const status = await callManualOrders({
              action: "check_order",
              order_id: data.order_id,
              access_token: data.access_token
            });
            if (status.status === "paid" && status.download_url) {
              paymentMessage.innerHTML = 'Malipo yamethibitishwa. <a href="' + escapeHtml(status.download_url) + '" target="_blank" rel="noopener">Pakua filamu sasa</a>';
              checkButton.hidden = true;
            } else {
              paymentMessage.textContent = status.message || "Malipo bado hayajathibitishwa.";
            }
          } catch (error) {
            paymentMessage.textContent = error.message;
          } finally {
            checkButton.disabled = false;
          }
        });
      } catch (error) {
        message.textContent = error.message;
        button.disabled = false;
        button.textContent = "Jaribu tena";
      }
    });
  });
  modal.classList.add("show");
}
async function loadFilms() {
  movieGrid.innerHTML = '<p class="catalog-loading">Inapakia filamu…</p>';
  emptyState.hidden = true;
  const endpoint = SUPABASE_URL + "/rest/v1/movies?select=id,title,description,category,price_tzs,poster_path,duration_minutes,release_year,created_at&is_published=eq.true&order=created_at.desc";
  try {
    const response = await fetch(endpoint, {headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY
    }});
    if (!response.ok) throw new Error("HTTP " + response.status);
    films = await response.json();
    renderFilms();
  } catch (error) {
    movieGrid.innerHTML = "";
    emptyState.textContent = "Imeshindikana kupakia filamu. Jaribu tena.";
    emptyState.hidden = false;
    console.error("My Movie Store:", error);
  }
}
categoryButtons.forEach(button => button.addEventListener("click", () => {
  activeCategory = button.dataset.category;
  categoryButtons.forEach(item => item.classList.toggle("selected", item === button));
  renderFilms();
}));
searchInput.addEventListener("input", renderFilms);
movieGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-film]");
  if (!button) return;
  const film = films.find(item => item.id === button.dataset.film);
  if (film) openFilmDetails(film);
});
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "×" : "☰";
});
mainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.textContent = "☰";
}));
document.getElementById("year").textContent = new Date().getFullYear();
loadFilms();
