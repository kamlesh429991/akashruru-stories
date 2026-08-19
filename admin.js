const SUPABASE_URL = "https://bxgtcnagqjtfbsztgnmb.supabase.co";
const SUPABASE_KEY = "sb_publishable_mQVSdlF4xEsVtW6eFt-vcQ_jQUVVY7G";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const PASSWORD = "AKASHRURU";

async function login() {
  const password = document.getElementById("pass").value;

  if (password === PASSWORD) {
    sessionStorage.arLogin = "1";
    showDashboard();
  } else {
    document.getElementById("err").textContent = "Wrong password.";
  }
}

function showDashboard() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("dash").classList.remove("hidden");
  loadStories();
}

function logout() {
  sessionStorage.removeItem("arLogin");
  location.reload();
}

if (sessionStorage.arLogin === "1") {
  showDashboard();
}

document.getElementById("form").onsubmit = async function(e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("cat").value;
  const body = document.getElementById("body").value.trim();

  const { error } = await supabaseClient
    .from("stories")
    .insert({
      title: title,
      category: category,
      body: body
    });

  if (error) {
    alert("Story save nahi hui: " + error.message);
    return;
  }

  alert("Story successfully published! ❤️");

  e.target.reset();
  loadStories();
};

async function loadStories() {
  const { data, error } = await supabaseClient
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    document.getElementById("list").innerHTML =
      "<p>Error: " + error.message + "</p>";
    return;
  }

  document.getElementById("list").innerHTML =
    data.map(story => `
      <div class="item">
        <div>
          <b>${escapeHTML(story.title)}</b><br>
          <small>${escapeHTML(story.category)}</small>
        </div>
        <button onclick="deleteStory('${story.id}')">Delete</button>
      </div>
    `).join("") || "<p>No stories yet.</p>";
}

async function deleteStory(id) {
  const { error } = await supabaseClient
    .from("stories")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Delete nahi hui: " + error.message);
    return;
  }

  loadStories();
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, m => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[m]));
}
