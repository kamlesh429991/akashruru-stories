const defaults = [
  {
    id: 1,
    title: "The Last Message",
    category: "Romantic",
    body: "Some stories begin with a hello. Ours began with a message that neither of us expected to change everything."
  },
  {
    id: 2,
    title: "A Room Full of Silence",
    category: "Sad",
    body: "The room was the same, but it no longer felt like home. Memories lived in every corner."
  },
  {
    id: 3,
    title: "The Door at 3:13",
    category: "Horror",
    body: "Every night at 3:13, someone knocked three times. He lived alone. On the seventh night, he opened the door."
  },
  {
    id: 4,
    title: "Two Seats by the Window",
    category: "Friendship",
    body: "They had different dreams, but every afternoon they still saved two seats by the window."
  }
];

let stories = JSON.parse(localStorage.getItem("arStories") || "null") || defaults;
let category = "All";

const grid = document.getElementById("grid");
const search = document.getElementById("search");

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

function render() {
  let query = search ? search.value.toLowerCase() : "";

  let filtered = stories.filter(function (story) {
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
    ? filtered.map(function (story) {
        return `
          <article class="card" onclick="openReader(${story.id})">
            <small>${escapeHTML(story.category)}</small>
            <h3>${escapeHTML(story.title)}</h3>
            <p>${escapeHTML(story.body)}</p>
            <span class="read">Read story →</span>
          </article>
        `;
      }).join("")
    : "<p>No stories found.</p>";
}

document.querySelectorAll("#filters button").forEach(function (button) {
  button.onclick = function () {
    document.querySelectorAll("#filters button")
      .forEach(function (b) {
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
  const story = stories.find(function (s) {
    return s.id == id;
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

render();
