const SUPABASE_URL = "https://rnnohvwrmwnhnbwczrpt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_pX9vsHwyUnItxBgKqKx5oQ_gCkh8kUH";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = id => document.getElementById(id);
let movies = [];
let orders = [];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function money(value) { return new Intl.NumberFormat("en-TZ").format(Number(value || 0)) + " TZS"; }
function dateText(value) { return value ? new Date(value).toLocaleDateString() : "—"; }
function toast(message) { const el=$("toast"); el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),3200); }
function setMessage(id,message,success=false) { const el=$(id); el.textContent=message; el.classList.toggle("success",success); }

function showLogin(message="") {
  $("appShell").hidden=true; $("loginScreen").hidden=false;
  setMessage("loginMessage",message);
}
function showApp(user) {
  $("loginScreen").hidden=true; $("appShell").hidden=false;
  $("adminEmail").textContent=user.email || "Admin";
  loadAllData();
}
async function verifyAdmin(user) {
  if (!user || user.app_metadata?.role !== "admin") {
    await supabaseClient.auth.signOut();
    showLogin("This account is not authorised as the store administrator. Ask the project owner to assign the admin role securely.");
    return false;
  }
  showApp(user);
  return true;
}
$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const button=$("loginButton"); button.disabled=true; button.textContent="Signing in…";
  setMessage("loginMessage","");
  const {data,error}=await supabaseClient.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});
  if (error) setMessage("loginMessage",error.message);
  else await verifyAdmin(data.user);
  button.disabled=false; button.textContent="Sign in";
});
$("logoutButton").addEventListener("click",async()=>{await supabaseClient.auth.signOut();showLogin("You have signed out.");});
supabaseClient.auth.onAuthStateChange((_event,session)=>{
  if (!session) { $("appShell").hidden=true; $("loginScreen").hidden=false; }
});
(async()=>{
  const {data:{session}}=await supabaseClient.auth.getSession();
  if (session) {
    const {data:{user},error}=await supabaseClient.auth.getUser();
    if (!error) await verifyAdmin(user); else showLogin("Please sign in again.");
  } else showLogin();
})();

async function loadAllData() { await Promise.all([loadMovies(),loadOrders()]); renderOverview(); }
async function loadMovies() {
  const {data,error}=await supabaseClient.from("movies").select("*").order("created_at",{ascending:false});
  if (error) { toast("Could not load movies: "+error.message); return; }
  movies=data||[]; renderMovies(); renderOverview();
}
async function loadOrders() {
  const {data,error}=await supabaseClient.from("orders").select("id,customer_id,customer_name,customer_phone,movie_id,amount_tzs,status,payment_method,provider_reference,created_at,paid_at,movies(title)").order("created_at",{ascending:false});
  if (error) { toast("Could not load orders: "+error.message); return; }
  orders=data||[]; renderOrders(); renderCustomers(); renderPayments(); renderOverview();
}
function statusBadge(status) {
  const safe=escapeHtml(status||"pending");
  return '<span class="status '+safe.toLowerCase()+'">'+safe+'</span>';
}
function renderOverview() {
  $("statMovies").textContent=movies.filter(m=>m.is_published).length;
  $("statAllMovies").textContent=movies.length;
  $("statOrders").textContent=orders.length;
  $("statPaid").textContent=orders.filter(o=>o.status==="paid").length;
  const rows=orders.slice(0,6);
  $("recentOrdersBody").innerHTML=rows.length?rows.map(o=>'<tr><td>'+escapeHtml(o.id.slice(0,8))+'</td><td>'+escapeHtml(o.customer_name || o.customer_phone || (o.customer_id ? o.customer_id.slice(0,8) : 'Mteja'))+'</td><td>'+escapeHtml(o.movies?.title||"Movie")+'</td><td>'+money(o.amount_tzs)+'</td><td>'+statusBadge(o.status)+'</td><td>'+dateText(o.created_at)+'</td></tr>').join(""):'<tr><td colspan="6" class="table-empty">No orders have been recorded yet.</td></tr>';
}
function renderMovies() {
  const term=$("movieSearch").value.trim().toLowerCase();
  const rows=movies.filter(m=>(m.title+" "+m.category).toLowerCase().includes(term));
  $("moviesBody").innerHTML=rows.length?rows.map(m=>'<tr><td><strong>'+escapeHtml(m.title)+'</strong><br><small>'+escapeHtml(m.slug)+'</small></td><td>'+escapeHtml(m.category)+'</td><td>'+money(m.price_tzs)+'</td><td>'+statusBadge(m.is_published?"published":"unpublished")+'</td><td>'+dateText(m.created_at)+'</td><td><button class="action-button" data-edit="'+m.id+'">Edit</button><button class="action-button danger" data-delete="'+m.id+'">Delete</button></td></tr>').join(""):'<tr><td colspan="6" class="table-empty">No movies found. Use “Add movie” to create your first record.</td></tr>';
}
function renderOrders() {
  $("ordersBody").innerHTML=orders.length?orders.map(o=>'<tr><td>'+escapeHtml(o.id)+'</td><td><strong>'+escapeHtml(o.customer_name||"Mteja")+'</strong><br><small>'+escapeHtml(o.customer_phone||o.customer_id||"—")+'</small></td><td>'+escapeHtml(o.movies?.title||"Filamu")+'</td><td>'+money(o.amount_tzs)+'</td><td>'+escapeHtml(o.payment_method||"—")+'</td><td>'+statusBadge(o.status)+'</td><td>'+dateText(o.created_at)+'</td></tr>').join(""):'<tr><td colspan="7" class="table-empty">Bado hakuna oda.</td></tr>';
}
function renderCustomers() {
  const map=new Map();
  orders.forEach(o=>{const key=o.customer_id||o.customer_phone||o.id;const item=map.get(key)||{name:o.customer_name||"Mteja",phone:o.customer_phone||o.customer_id||"—",count:0,total:0};item.count++;if(o.status==="paid")item.total+=Number(o.amount_tzs||0);map.set(key,item);});
  $("customersBody").innerHTML=map.size?[...map.values()].map(v=>'<tr><td>'+escapeHtml(v.name)+'<br><small>'+escapeHtml(v.phone)+'</small></td><td>'+v.count+'</td><td>'+money(v.total)+'</td></tr>').join(""):'<tr><td colspan="3" class="table-empty">Bado hakuna wateja.</td></tr>';
}
function renderPayments() {
  $("paymentsBody").innerHTML=orders.length?orders.map(o=>'<tr><td>'+escapeHtml(o.id.slice(0,8))+'</td><td>'+escapeHtml(o.provider_reference||"—")+'</td><td>'+escapeHtml(o.payment_method||"—")+'</td><td>'+money(o.amount_tzs)+'</td><td>'+statusBadge(o.status)+(o.status==="pending"&&o.provider_reference?'<br><button class="action-button" data-confirm-payment="'+escapeHtml(o.id)+'">Thibitisha malipo</button>':'')+'</td></tr>').join(""):'<tr><td colspan="5" class="table-empty">Bado hakuna malipo.</td></tr>';
}
const sectionPages={overview:"overviewPage",movies:"moviesPage",orders:"ordersPage",customers:"customersPage",payments:"paymentsPage"};
function showSection(section) {
  if (!sectionPages[section]) section="overview";
  Object.entries(sectionPages).forEach(([key,id])=>$(id).hidden=key!==section);
  document.querySelectorAll("[data-section]").forEach(link=>link.classList.toggle("active",link.dataset.section===section));
  $("pageCrumb").textContent=section[0].toUpperCase()+section.slice(1);
  $("sidebar").classList.remove("open"); $("mobileMenu").setAttribute("aria-expanded","false");
  history.replaceState(null,"","#"+section);
}
document.querySelectorAll("[data-section]").forEach(link=>link.addEventListener("click",event=>{event.preventDefault();showSection(link.dataset.section);}));
$("mobileMenu").addEventListener("click",()=>{const open=$("sidebar").classList.toggle("open");$("mobileMenu").setAttribute("aria-expanded",String(open));});
$("refreshButton").addEventListener("click",loadAllData);
$("reloadMovies").addEventListener("click",loadMovies);
$("reloadOrders").addEventListener("click",loadOrders);
$("movieSearch").addEventListener("input",renderMovies);

function openMovieModal(movie=null) {
  $("movieForm").reset(); $("movieId").value=movie?.id||"";
  $("movieFormTitle").textContent=movie?"Edit movie":"Add a movie";
  $("movieTitle").value=movie?.title||""; $("movieCategory").value=movie?.category||"Drama";
  $("moviePrice").value=movie?.price_tzs??5000; $("movieYear").value=movie?.release_year||"";
  $("movieDuration").value=movie?.duration_minutes||""; $("movieDescription").value=movie?.description||"";
  $("moviePublished").checked=!!movie?.is_published; setMessage("movieMessage","");
  $("movieModal").hidden=false;
}
function closeMovieModal() {$("movieModal").hidden=true;}
$("addMovieButton").addEventListener("click",()=>openMovieModal());
$("closeMovieModal").addEventListener("click",closeMovieModal);
$("cancelMovie").addEventListener("click",closeMovieModal);
$("moviesBody").addEventListener("click",async event=>{
  const edit=event.target.closest("[data-edit]"); const del=event.target.closest("[data-delete]");
  if(edit){const movie=movies.find(m=>m.id===edit.dataset.edit);if(movie)openMovieModal(movie);}
  if(del){const movie=movies.find(m=>m.id===del.dataset.delete);if(!movie||!confirm("Delete “"+movie.title+"” from the catalogue?"))return;
    const {error}=await supabaseClient.from("movies").delete().eq("id",movie.id);
    if(error){toast("Delete failed: "+error.message);return;}
    const paths=[movie.poster_path&&["movie-posters",movie.poster_path],movie.file_path&&["movie-files",movie.file_path]].filter(Boolean);
    for(const [bucket,path] of paths) await supabaseClient.storage.from(bucket).remove([path]);
    toast("Movie deleted."); await loadMovies();
  }
});
function slugify(value){return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
async function uploadAsset(bucket,file) {
  const ext=(file.name.split(".").pop()||"bin").toLowerCase().replace(/[^a-z0-9]/g,"");
  const path=crypto.randomUUID()+"."+ext;
  const {error}=await supabaseClient.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||undefined});
  if(error)throw error;
  return path;
}
$("movieForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const button=$("saveMovieButton");button.disabled=true;button.textContent="Saving…";setMessage("movieMessage","");
  try {
    const id=$("movieId").value;
    const title=$("movieTitle").value.trim();
    const slug=slugify(title);
    if(!slug)throw new Error("Please enter a valid movie title.");
    const movie={title,slug,category:$("movieCategory").value,price_tzs:Number($("moviePrice").value),description:$("movieDescription").value.trim(),release_year:$("movieYear").value?Number($("movieYear").value):null,duration_minutes:$("movieDuration").value?Number($("movieDuration").value):null,is_published:$("moviePublished").checked};
    const old=movies.find(m=>m.id===id);
    if(old?.poster_path)movie.poster_path=old.poster_path;
    if(old?.file_path)movie.file_path=old.file_path;
    const poster=$("moviePoster").files[0],file=$("movieFile").files[0];
    if(poster)movie.poster_path=await uploadAsset("movie-posters",poster);
    if(file)movie.file_path=await uploadAsset("movie-files",file);
    if(id){const {error}=await supabaseClient.from("movies").update(movie).eq("id",id);if(error)throw error;}
    else {const {error}=await supabaseClient.from("movies").insert(movie);if(error)throw error;}
    closeMovieModal();toast(id?"Movie updated successfully.":"Movie added successfully.");await loadMovies();
  } catch(error) {setMessage("movieMessage",error.message||"Could not save movie.");}
  finally {button.disabled=false;button.textContent="Save movie";}
});
const initial=location.hash.slice(1);
if(initial&&sectionPages[initial])showSection(initial);
