const PASSWORD = "AKASHRURU";

let stories =
  JSON.parse(localStorage.getItem("arStories") || "null") || [];

function login() {
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
  renderStories();
}

function logout() {
  sessionStorage.removeItem("arLogin");
  location.reload();
}

if (sessionStorage.arLogin === "1") {
  showDashboard();
}

document.getElementById("form").onsubmit = function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("cat").value;
  const body = document.getElementById("body").value.trim();

  stories.unshift({
    id: Date.now(),
    title: title,
    category: category,
    body: body
  });

  saveStories();
  e.target.reset();
  renderStories();
};

function saveStories() {
  localStorage.setItem("arStories", JSON.stringify(stories));
}

function renderStories() {
  const list = document.getElementById("list");

  list.innerHTML =
    stories
      .map(
        function (story) {
          return `
            <div class="item">
              <div>
                <b>${escapeHTML(story.title)}</b>
                <br>
                <small>${escapeHTML(story.category)}</small>
              </div>

              <button onclick="deleteStory(${story.id})">
                Delete
              </button>
            </div>
          `;
        }
      )
      .join("") || "<p>No stories yet.</p>";
}

function deleteStory(id) {
  stories = stories.filter(function (story) {
    return story.id !== id;
  });

  saveStories();
  renderStories();
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
