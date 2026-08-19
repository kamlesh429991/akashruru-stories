const PASSWORD = "AKASHRURU";

const SUPABASE_URL = "https://bxgtcnagqjtfbsztgnmb.supabase.co";
const SUPABASE_KEY = "sb_publishable_mQVSdlF4xEsVtW6eFt-vcQ_jQUVVY7G";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let stories = [];

async function login() {
  const password = document.getElementById("pass").value;

  if (password === PASSWORD) {
    sessionStorage.arLogin = "1";
    await showDashboard();
  } else {
    document.getElementById("err").textContent = "Wrong password.";
  }
}

async function showDashboard() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("dash").classList.remove("hidden");
  await renderStories();
}

function logout() {
  sessionStorage.removeItem("arLogin");
  location.reload();
}

if (sessionStorage.arLogin === "1") {
  showDashboard();
}

document.getElementById("form").onsubmit = async function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("cat").value;
  const body = document.getElementById("body").value.trim();

  const { error } = await supabaseClient
    .from("stories")
    .insert([
      {
        title: title,
        category: category,
        content: body
      }
    ]);

  if (error) {
    alert("Story save nahi hui: " + error.message);
    return;
  }

  e.target.reset();
  await renderStories();
};

async function renderStories() {
  const list = document.getElementById("list");

  const { data, error } = await supabaseClient
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = "<p>Stories load nahi hui.</p>";
    console.error(error);
    return;
  }

  stories = data || [];

  list.innerHTML =
    stories
      .map(function (story) {
        return `
          <div class="item">
            <div>
              <b>${escapeHTML(story.title)}</b>
              <br>
              <small>${escapeHTML(story.category)}</small>
            </div>

            <button onclick="deleteStory('${story.id}')">
              Delete
            </button>
          </div>
        `;
      })
      .join("") || "<p>No stories yet.</p>";
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

  await renderStories();
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m];
  });
}
