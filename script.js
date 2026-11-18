const SUPABASE_URL = "https://rnnohvwrmwnhnbwczrpt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_pX9vsHwyUnItxBgKqKx5oQ_gCkh8kUH";

const movieGrid = document.getElementById("movieGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll(".filter-chip");
let films = [];
let activeCategory = "All";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (char) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char];
  });
}

function formatPrice(amount) {
  return new Intl.NumberFormat("en-TZ").format(Number(amount || 0)) + " TZS";
}

function posterUrl(path) {
  if (!path) return "";
  return SUPABASE_URL + "/storage/v1/object/public/movie-posters/" +
    path.split("/").map(encodeURIComponent).join("/");
}

function renderFilms() {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = films.filter(function (film) {
    const matchesCategory = activeCategory === "All" || film.category === activeCategory;
    const matchesSearch = (film.title + " " + (film.description || "") + " " + film.category)
      .toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  movieGrid.innerHTML = filtered.map(function (film) {
    const image = posterUrl(film.poster_path);
    const duration = film.duration_minutes ? film.duration_minutes + " min" : "Movie";
    const year = film.release_year || "New";
    return '<article class="movie-card">' +
      '<div class="poster-wrap">' +
      (image ? '<img src="' + escapeHtml(image) + '" alt="Poster for ' + escapeHtml(film.title) + '" loading="lazy">' :
        '<div class="poster-placeholder">MY MOVIE STORE</div>') +
      '<div class="poster-shade"></div>' +
      '<span class="film-label">' + escapeHtml(film.category || "Film") + '</span>' +
      '</div><div class="movie-info">' +
      '<div class="movie-meta"><span>' + escapeHtml(year) + '</span><span>' + escapeHtml(duration) + '</span></div>' +
      '<h3>' + escapeHtml(film.title) + '</h3>' +
      '<p>' + escapeHtml(film.description || "Discover this story from My Movie Store.") + '</p>' +
      '<div class="movie-bottom"><span class="price">' + formatPrice(film.price_tzs) + '</span>' +
      '<button class="buy-button" type="button" data-film="' + escapeHtml(film.id) + '">View film ↗</button>' +
      '</div></div></article>';
  }).join("");

  emptyState.hidden = filtered.length !== 0;
  if (!filtered.length && !films.length) {
    emptyState.textContent = "No published films yet. Please check back soon.";
  } else {
    emptyState.textContent = "No films match your search. Try another title or category.";
  }
}

async function loadFilms() {
  movieGrid.innerHTML = '<p class="catalog-loading">Loading films…</p>';
  emptyState.hidden = true;
  const endpoint = SUPABASE_URL + "/rest/v1/movies?select=id,title,description,category,price_tzs,poster_path,duration_minutes,release_year,created_at&is_published=eq.true&order=created_at.desc";
  try {
    const response = await fetch(endpoint, {
      headers: {
        "apikey": SUPABASE_PUBLISHABLE_KEY,
        "Authorization": "Bearer " + SUPABASE_PUBLISHABLE_KEY
      }
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error("Could not load films (" + response.status + "). " + detail);
    }
    films = await response.json();
    renderFilms();
  } catch (error) {
    movieGrid.innerHTML = "";
    emptyState.textContent = "Films could not be loaded right now. Please refresh the page.";
    emptyState.hidden = false;
    console.error("My Movie Store:", error);
  }
}

categoryButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    activeCategory = button.dataset.category;
    categoryButtons.forEach(function (item) {
      item.classList.toggle("selected", item === button);
    });
    renderFilms();
  });
});

searchInput.addEventListener("input", renderFilms);

movieGrid.addEventListener("click", function (event) {
  const button = event.target.closest("[data-film]");
  if (!button) return;
  const film = films.find(function (item) { return item.id === button.dataset.film; });
  if (film) {
    alert(film.title + "\n\n" + (film.description || "") + "\n\nPrice: " +
      formatPrice(film.price_tzs) +
      "\n\nOnline checkout and secure downloads will be connected in a later stage.");
  }
});

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", function () {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "×" : "☰";
});

mainNav.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  });
});

document.getElementById("year").textContent = new Date().getFullYear();
loadFilms();
