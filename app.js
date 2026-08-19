const SUPABASE_URL = "https://bxgtcnagqjtfbsztgnmb.supabase.co";
const SUPABASE_KEY = "sb_publishable_mQVSdlF4xEsVtW6eFt-vcQ_jQUVVY7G";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let stories = [];
let category = "All";

const grid = document.getElementById("grid");
const search = document.getElementById("search");

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, function(m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m];
  });
}

async function loadStories() {
  const { data, error } = await supabaseClient
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    grid.innerHTML = "<p>Stories load nahi ho paayi.</p>";
    return;
  }

  stories = data || [];
  render();
}

function render() {
  const query = search ? search.value.toLowerCase() : "";

  const filtered = stories.filter(function(story) {
    return (
      (category === "All" || story.category === category) &&
      (
        !query ||
        story.title.toLowerCase().includes(query) ||
        story.body.toLowerCase().includes(query)
      )
    );
  });

  grid.innerHTML = filtered.length
    ? filtered.map(function(story) {
        return `
          <article class="card" onclick="openReader('${story.id}')">
            <small>${escapeHTML(story.category)}</small>
            <h3>${escapeHTML(story.title)}</h3>
            <p>${escapeHTML(story.body)}</p>
            <span class="read">Read story →</span>
          </article>
        `;
      }).join("")
    : "<p>No stories found.</p>";
}

document.querySelectorAll("#filters button").forEach(function(button) {
  button.onclick = function() {
    document.querySelectorAll("#filters button")
      .forEach(function(b) {
        b.classList.remove("on");
      });

    button.classList.add("on");
    category = button.dataset.c;
    render();
  };
});

if (search) {
  search.oninput = render;
}

function openReader(id) {
  const story = stories.find(function(s) {
    return String(s.id) === String(id);
  });

  if (!story) return;

  document.getElementById("rc").textContent = story.category;
  document.getElementById("rt").textContent = story.title;
  document.getElementById("rb").textContent = story.body;
  document.getElementById("reader").classList.add("show");
}

function closeReader() {
  document.getElementById("reader").classList.remove("show");
}

if (document.getElementById("year")) {
  document.getElementById("year").textContent = new Date().getFullYear();
}

loadStories();
