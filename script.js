const films = [
  {id:1,title:"The Last Horizon",category:"Drama",year:2025,duration:"1h 42m",price:8000,description:"A moving story about hope, distance and the meaning of home.",image:"https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=700&q=85"},
  {id:2,title:"Midnight Run",category:"Action",year:2025,duration:"48 min",price:5000,description:"One unexpected night changes everything for a quiet town.",image:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=85"},
  {id:3,title:"A Place to Begin",category:"Short Film",year:2024,duration:"22 min",price:3000,description:"A small act of kindness opens the door to a new beginning.",image:"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=700&q=85"},
  {id:4,title:"The Good Neighbours",category:"Comedy",year:2025,duration:"56 min",price:5000,description:"Two neighbours. One big misunderstanding. Endless laughter.",image:"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=700&q=85"},
  {id:5,title:"Beyond the Silence",category:"Drama",year:2024,duration:"34 min",price:4000,description:"A heartfelt short film about family, truth and forgiveness.",image:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=85"},
  {id:6,title:"City of Dreams",category:"Action",year:2025,duration:"1h 18m",price:7000,description:"A young dreamer takes a chance on a city full of surprises.",image:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=85"},
  {id:7,title:"One More Sunday",category:"Comedy",year:2024,duration:"19 min",price:3000,description:"A simple weekend plan turns into a day to remember.",image:"https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=700&q=85"},
  {id:8,title:"The Crossing",category:"Short Film",year:2025,duration:"27 min",price:3500,description:"A journey across unfamiliar ground brings two lives together.",image:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=85"}
];

const movieGrid = document.getElementById("movieGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll(".filter-chip");
let activeCategory = "All";

function formatPrice(amount) {
  return new Intl.NumberFormat("en-TZ").format(amount) + " TZS";
}

function renderFilms() {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = films.filter(film => {
    const matchesCategory = activeCategory === "All" || film.category === activeCategory;
    const matchesSearch = (film.title + " " + film.description + " " + film.category).toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  movieGrid.innerHTML = filtered.map(film => `
    <article class="movie-card">
      <div class="poster-wrap">
        <img src="${film.image}" alt="Artwork for ${film.title}" loading="lazy">
        <div class="poster-shade"></div>
        <span class="film-label">${film.category}</span>
      </div>
      <div class="movie-info">
        <div class="movie-meta"><span>${film.year}</span><span>${film.duration}</span></div>
        <h3>${film.title}</h3>
        <p>${film.description}</p>
        <div class="movie-bottom">
          <span class="price">${formatPrice(film.price)}</span>
          <button class="buy-button" type="button" data-film="${film.id}">View film ↗</button>
        </div>
      </div>
    </article>
  `).join("");

  emptyState.hidden = filtered.length !== 0;
}

categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    categoryButtons.forEach(item => item.classList.toggle("selected", item === button));
    renderFilms();
  });
});

searchInput.addEventListener("input", renderFilms);

movieGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-film]");
  if (!button) return;
  const film = films.find(item => item.id === Number(button.dataset.film));
  if (film) {
    alert(film.title + "\n\n" + film.description + "\n\nPrice: " + formatPrice(film.price) + "\n\nOnline checkout and downloads will be connected in the next development stage.");
  }
});

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "×" : "☰";
});

mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  });
});

document.getElementById("year").textContent = new Date().getFullYear();
renderFilms();