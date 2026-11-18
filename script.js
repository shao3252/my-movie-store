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
    '<p class="detail-note">Ununuzi na upakuaji utafunguliwa baada ya malipo kuunganishwa.</p></div>';
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
