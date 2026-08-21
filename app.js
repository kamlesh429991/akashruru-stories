const SUPABASE_URL = "https://bxgtcnagqjtfbsztgnmb.supabase.co";
const SUPABASE_KEY = "sb_publishable_mQVSdlF4xEsVtW6eFt-vcQ_jQUVVY7G";

const supabaseClient =
  supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let stories = [];
let category = "All";
let currentStory = null;
let currentMood = "romantic";
let currentTrack = 0;

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const audio = document.getElementById("audio");

const musicTracks = {
  romantic: [{
    name: "Romantic Piano",
    url: "https://bxgtcnagqjtfbsztgnmb.supabase.co/storage/v1/object/public/music/solarflex-romantic-495654.mp3"
  }],
  sad: [{
    name: "Sad Piano",
    url: "https://bxgtcnagqjtfbsztgnmb.supabase.co/storage/v1/object/public/music/soundgallerybydmitrytaras-sad-piano-496878.mp3"
  }],
  horror: [{
    name: "Horror Ambience",
    url: "https://bxgtcnagqjtfbsztgnmb.supabase.co/storage/v1/object/public/music/atlasaudio-horror-ambience-512255.mp3"
  }],
  calm: [{
    name: "Calm Night",
    url: "https://bxgtcnagqjtfbsztgnmb.supabase.co/storage/v1/object/public/music/paulyudin-sad-piano-music-376015.mp3"
  }]
};


/* =========================
   SECURITY
========================= */

function escapeHTML(text) {
  return String(text || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}


/* =========================
   LOCAL STORAGE
========================= */

function getFavorites() {
  try {
    return JSON.parse(
      localStorage.getItem("akashruru_favorites") || "[]"
    );
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(
    "akashruru_favorites",
    JSON.stringify(list)
  );
}

function isFavorite(id) {
  return getFavorites().includes(String(id));
}

function toggleFavorite(id) {

  const sid = String(id);
  let list = getFavorites();

  if (list.includes(sid)) {
    list = list.filter(x => x !== sid);
    showToast("Removed from favorites");
  } else {
    list.push(sid);
    showToast("❤️ Added to favorites");
  }

  saveFavorites(list);

  render();
}


/* =========================
   TOAST
========================= */

function showToast(message) {

  let toast = document.getElementById("toast");

  if (!toast) {

    toast = document.createElement("div");
    toast.id = "toast";

    Object.assign(toast.style, {
      position: "fixed",
      left: "50%",
      bottom: "30px",
      transform: "translateX(-50%) translateY(20px)",
      padding: "13px 20px",
      borderRadius: "30px",
      background: "#ff79b7",
      color: "#240918",
      font: "700 13px Arial",
      zIndex: "99999",
      opacity: "0",
      transition: ".3s",
      pointerEvents: "none"
    });

    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform =
    "translateX(-50%) translateY(0)";

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform =
      "translateX(-50%) translateY(20px)";
  }, 1800);
}


/* =========================
   LOAD STORIES
========================= */

async function loadStories() {

  if (grid) {
    grid.innerHTML =
      `<div class="empty"><p>Loading stories...</p></div>`;
  }

  const { data, error } = await supabaseClient
    .from("stories")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(error);

    if (grid) {
      grid.innerHTML =
        `<div class="empty">
          <h3>Stories load nahi ho paayi.</h3>
          <p>Please try again.</p>
        </div>`;
    }

    return;
  }

  stories = data || [];

  updateStoryCount();
  render();
  renderFeatured();
}


/* =========================
   STORY COUNT
========================= */

function updateStoryCount() {

  const counter =
    document.getElementById("storyCount");

  if (counter) {
    animateNumber(
      counter,
      stories.length
    );
  }
}

function animateNumber(element, target) {

  const duration = 700;
  const start = performance.now();

  function step(now) {

    const progress =
      Math.min(
        (now - start) / duration,
        1
      );

    const value =
      Math.floor(
        target * (1 - Math.pow(1 - progress, 3))
      );

    element.textContent = value;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}


/* =========================
   GET FILTERED STORIES
========================= */

function getFilteredStories() {

  const query =
    search
      ? search.value.toLowerCase().trim()
      : "";

  return stories.filter(story => {

    const title =
      String(story.title || "").toLowerCase();

    const body =
      String(
        story.body ||
        story.content ||
        ""
      ).toLowerCase();

    const matchesCategory =
      category === "All" ||
      story.category === category;

    const matchesSearch =
      !query ||
      title.includes(query) ||
      body.includes(query);

    return matchesCategory && matchesSearch;
  });
}


/* =========================
   RENDER STORIES
========================= */

function render() {

  if (!grid) return;

  const filtered =
    getFilteredStories();

  if (!filtered.length) {

    grid.innerHTML = `
      <div class="empty">
        <h3>No stories found</h3>
        <p>Try another category or search.</p>
      </div>
    `;

    return;
  }

  grid.innerHTML =
    filtered.map(story => {

      const image =
        story.image_url
          ? `
            <img
              src="${escapeHTML(story.image_url)}"
              alt="${escapeHTML(story.title)}"
              loading="lazy"
              style="
                width:100%;
                height:160px;
                object-fit:cover;
                border-radius:14px;
                margin-bottom:15px;
              "
            >
          `
          : "";

      const favorite =
        isFavorite(story.id)
          ? "♥"
          : "♡";

      return `
        <article
          class="card"
          data-story-id="${escapeHTML(story.id)}">

          ${image}

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
          ">

            <small>
              ${escapeHTML(story.category)}
            </small>

            <button
              type="button"
              onclick="event.stopPropagation();toggleFavorite('${escapeHTML(story.id)}')"
              style="
                background:none;
                border:0;
                color:#ff79b7;
                font-size:25px;
                cursor:pointer;
              "
              aria-label="Favorite">
              ${favorite}
            </button>

          </div>

          <h3>
            ${escapeHTML(story.title)}
          </h3>

          <p>
            ${escapeHTML(
              story.body ||
              story.content ||
              ""
            )}
          </p>

          <span class="read">
            Read story →
          </span>

        </article>
      `;

    }).join("");

  document
    .querySelectorAll(".card[data-story-id]")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => openReader(card.dataset.storyId)
      );

    });
}


/* =========================
   FEATURED
========================= */

function renderFeatured() {

  const box =
    document.getElementById("featuredGrid");

  if (!box) return;

  const featured =
    stories.slice(0, 3);

  if (!featured.length) {

    box.innerHTML =
      "<p>Stories coming soon...</p>";

    return;
  }

  box.innerHTML =
    featured.map(story => `

      <article
        class="featured-card"
        data-featured-id="${escapeHTML(story.id)}">

        <small>
          ${escapeHTML(story.category)}
        </small>

        <h3>
          ${escapeHTML(story.title)}
        </h3>

        <p>
          ${escapeHTML(
            story.body ||
            story.content ||
            ""
          )}
        </p>

        <span class="read">
          Read story →
        </span>

      </article>

    `).join("");

  document
    .querySelectorAll("[data-featured-id]")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => openReader(card.dataset.featuredId)
      );

    });
}


/* =========================
   FILTERS
========================= */

document
  .querySelectorAll("#filters button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll("#filters button")
          .forEach(b =>
            b.classList.remove("on")
          );

        button.classList.add("on");

        category =
          button.dataset.c || "All";

        render();
      }
    );

  });


/* =========================
   SEARCH
========================= */

if (search) {

  search.addEventListener(
    "input",
    render
  );

}


/* =========================
   READER
========================= */

function openReader(id) {

  const story =
    stories.find(
      s => String(s.id) === String(id)
    );

  if (!story) return;

  currentStory = story;

  const rc =
    document.getElementById("rc");

  const rt =
    document.getElementById("rt");

  const rb =
    document.getElementById("rb");

  if (rc)
    rc.textContent =
      story.category || "";

  if (rt)
    rt.textContent =
      story.title || "";

  if (rb)
    rb.textContent =
      story.body ||
      story.content ||
      "";

  const imageWrap =
    document.getElementById(
      "readerImageWrap"
    );

  const image =
    document.getElementById(
      "readerImage"
    );

  if (story.image_url) {

    if (image)
      image.src =
        story.image_url;

    if (imageWrap)
      imageWrap.classList.add("show");

  } else {

    if (image)
      image.removeAttribute("src");

    if (imageWrap)
      imageWrap.classList.remove("show");
  }

  const reader =
    document.getElementById("reader");

  if (reader)
    reader.classList.add("show");

  document.body.style.overflow =
    "hidden";

  localStorage.setItem(
    "akashruru_last_story",
    String(story.id)
  );

  updateReadingProgress();

  showToast("📖 Enjoy the story");
}


/* =========================
   CLOSE READER
========================= */

function closeReader() {

  const reader =
    document.getElementById("reader");

  if (reader)
    reader.classList.remove("show");

  document.body.style.overflow = "";
}


/* =========================
   READING PROGRESS
========================= */

function updateReadingProgress() {

  const box =
    document.querySelector(
      ".reader-box"
    );

  const bar =
    document.getElementById(
      "readingProgress"
    );

  if (!box || !bar) return;

  const scrollTop =
    box.scrollTop;

  const scrollHeight =
    box.scrollHeight -
    box.clientHeight;

  const percent =
    scrollHeight > 0
      ? (scrollTop / scrollHeight) * 100
      : 0;

  bar.style.width =
    Math.min(100, Math.max(0, percent))
    + "%";
}

document.addEventListener(
  "scroll",
  updateReadingProgress,
  true
);


/* =========================
   SURPRISE ME
========================= */

function surpriseMe() {

  if (!stories.length) {

    showToast(
      "No stories available yet."
    );

    return;
  }

  const random =
    stories[
      Math.floor(
        Math.random() *
        stories.length
      )
    ];

  openReader(random.id);
}


/* =========================
   SHARE STORY
========================= */

async function shareCurrentStory() {

  if (!currentStory) return;

  const title =
    currentStory.title ||
    "AkashRuru Story";

  const url =
    window.location.href;

  if (navigator.share) {

    try {

      await navigator.share({
        title,
        text:
          "Read this story on AkashRuru Stories",
        url
      });

      return;

    } catch {}
  }

  try {

    await navigator.clipboard.writeText(
      `${title}\n${url}`
    );

    showToast(
      "🔗 Story link copied"
    );

  } catch {

    showToast(
      "Share not available"
    );
  }
}


/* =========================
   COPY STORY
========================= */

async function copyCurrentStory() {

  if (!currentStory) return;

  const text =
    `${currentStory.title}\n\n` +
    `${currentStory.body ||
      currentStory.content ||
      ""}`;

  try {

    await navigator.clipboard.writeText(
      text
    );

    showToast(
      "📋 Story copied"
    );

  } catch {

    showToast(
      "Copy failed"
    );
  }
}


/* =========================
   MUSIC MOOD
========================= */

function setMood(mood) {

  currentMood =
    mood;

  currentTrack = 0;

  document
    .querySelectorAll(".mood")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.mood === mood
      );

    });

  loadMusic();
}


/* =========================
   LOAD MUSIC
========================= */

function loadMusic() {

  const tracks =
    musicTracks[currentMood] || [];

  if (!tracks.length) return;

  const track =
    tracks[currentTrack];

  const name =
    document.getElementById(
      "trackName"
    );

  if (name)
    name.textContent =
      track.name;

  if (audio) {

    audio.pause();

    audio.src =
      track.url;

    audio.load();
  }

  const play =
    document.getElementById(
      "playMusic"
    );

  if (play)
    play.textContent = "▶";

  const bar =
    document.getElementById(
      "progressBar"
    );

  if (bar)
    bar.style.width = "0%";
}


/* =========================
   PLAY MUSIC
========================= */

function playMusic() {

  if (!audio) return;

  if (audio.paused) {

    audio.play()
      .then(() => {

        const button =
          document.getElementById(
            "playMusic"
          );

        if (button)
          button.textContent = "⏸";

      })
      .catch(() => {

        showToast(
          "Tap again to start music"
        );

      });

  } else {

    audio.pause();

    const button =
      document.getElementById(
        "playMusic"
      );

    if (button)
      button.textContent = "▶";
  }
}


/* =========================
   NEXT MUSIC
========================= */

function nextMusic() {

  const tracks =
    musicTracks[currentMood];

  if (!tracks?.length) return;

  currentTrack =
    (currentTrack + 1) %
    tracks.length;

  loadMusic();
}


/* =========================
   PREVIOUS MUSIC
========================= */

function previousMusic() {

  const tracks =
    musicTracks[currentMood];

  if (!tracks?.length) return;

  currentTrack =
    (
      currentTrack -
      1 +
      tracks.length
    ) %
    tracks.length;

  loadMusic();
}


/* =========================
   MUSIC EVENTS
========================= */

document
  .querySelectorAll(".mood")
  .forEach(button => {

    button.addEventListener(
      "click",
      () =>
        setMood(button.dataset.mood)
    );

  });

document
  .getElementById("playMusic")
  ?.addEventListener(
    "click",
    playMusic
  );

document
  .getElementById("nextMusic")
  ?.addEventListener(
    "click",
    nextMusic
  );

document
  .getElementById("prevMusic")
  ?.addEventListener(
    "click",
    previousMusic
  );


/* =========================
   AUDIO PROGRESS
========================= */

if (audio) {

  audio.addEventListener(
    "timeupdate",
    () => {

      if (!audio.duration) return;

      const percentage =
        (
          audio.currentTime /
          audio.duration
        ) * 100;

      const bar =
        document.getElementById(
          "progressBar"
        );

      if (bar)
        bar.style.width =
          percentage + "%";
    }
  );

  audio.addEventListener(
    "ended",
    () => {

      nextMusic();

      audio.play()
        .catch(() => {});

    }
  );
}


/* =========================
   MOBILE MENU
========================= */

document
  .getElementById("menuBtn")
  ?.addEventListener(
    "click",
    () => {

      document
        .querySelector(".nav-links")
        ?.classList.toggle("open");

    }
  );


/* =========================
   READER CLOSE
========================= */

document
  .getElementById("reader")
  ?.addEventListener(
    "click",
    event => {

      if (
        event.target.id === "reader"
      ) {
        closeReader();
      }

    }
  );


/* =========================
   KEYBOARD
========================= */

document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {
      closeReader();
    }

    if (
      event.key === "/" &&
      document.activeElement !== search
    ) {

      event.preventDefault();

      search?.focus();
    }

  }
);


/* =========================
   YEAR
========================= */

const year =
  document.getElementById("year");

if (year)
  year.textContent =
    new Date().getFullYear();


/* =========================
   START
========================= */

setMood("romantic");

loadStories();
