const sidebar = document.getElementById("sidebar");
const mobileMenu = document.getElementById("mobileMenu");
const overview = document.getElementById("overview");
const otherPage = document.getElementById("otherPage");
const pageCrumb = document.getElementById("pageCrumb");
const otherTitle = document.getElementById("otherTitle");
const otherDescription = document.getElementById("otherDescription");
const placeholderTitle = document.getElementById("placeholderTitle");

const sectionInfo = {
  overview: ["Overview", "Your store activity at a glance.", "Dashboard overview"],
  movies: ["Movies", "Add, update and publish films in your catalogue.", "Movie management will be connected next"],
  orders: ["Orders", "Review customer purchases and download access.", "Order management will be connected next"],
  customers: ["Customers", "View and manage registered customers.", "Customer management will be connected next"],
  payments: ["Payments", "Track Mobile Money payments and transaction status.", "Payment management will be connected next"],
  settings: ["Settings", "Configure your store profile and preferences.", "Store settings will be connected next"]
};

function showSection(section) {
  const info = sectionInfo[section] || sectionInfo.overview;
  document.querySelectorAll(".side-link").forEach(link => {
    link.classList.toggle("active", link.dataset.section === section);
  });
  pageCrumb.textContent = info[0];

  if (section === "overview") {
    overview.hidden = false;
    otherPage.hidden = true;
  } else {
    overview.hidden = true;
    otherPage.hidden = false;
    otherTitle.textContent = info[0];
    otherDescription.textContent = info[1];
    placeholderTitle.textContent = info[2];
  }

  sidebar.classList.remove("open");
  mobileMenu.setAttribute("aria-expanded", "false");
}

document.querySelectorAll("[data-section]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    showSection(link.dataset.section);
    history.replaceState(null, "", "#" + link.dataset.section);
  });
});

mobileMenu.addEventListener("click", () => {
  const opened = sidebar.classList.toggle("open");
  mobileMenu.setAttribute("aria-expanded", String(opened));
});

document.getElementById("backOverview").addEventListener("click", () => {
  showSection("overview");
  history.replaceState(null, "", "#overview");
});

const initialSection = location.hash.slice(1);
if (sectionInfo[initialSection]) showSection(initialSection);