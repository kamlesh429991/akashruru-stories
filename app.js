/* =========================================================
   AKASHRURU STORIES — APP.JS
   Cinematic Story Experience
========================================================= */

const SUPABASE_URL = "https://bxgtcnagqjtfbsztgnmb.supabase.co";
const SUPABASE_KEY = "sb_publishable_mQVSdlF4xEsVtW6eFt-vcQ_jQUVVY7G";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let stories = [];
let category = "All";
let currentStory = null;
let currentMood = "romantic";
let currentTrack = 0;

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const audio = document.getElementById("audio");

/* =========================================================
   SAFE HTML
========================================================= */

function escapeHTML(text) {
  return String(text || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

/* =========================================================
   EXTRA UI
========================================================= */

function createExtraUI() {

  if (!document.getElementById("ar-toast")) {
    const toast = document.createElement("div");
    toast.id = "ar-toast";
    toast.style.cssText = `
      position:fixed;
      left:50%;
      bottom:25px;
      transform:translate(-50%,20px);
      opacity:0;
      z-index:10000;
      padding:13px 20px;
      border-radius:30px;
      background:rgba(20,14,24,.94);
      color:#fff;
      border:1px solid rgba(255,121,183,.35);
      backdrop-filter:blur(15px);
      font:13px Arial,sans-serif;
      transition:.35s;
      pointer-events:none;
    `;
    document.body.appendChild(toast);
  }

  if (!document.getElementById("cursorGlow")) {
    const glow = document.createElement("div");
    glow.id = "cursorGlow";
    glow.style.cssText = `
      position:fixed;
      width:180px;
      height:180px;
      border-radius:50%;
      pointer-events:none;
      z-index:9990;
      background:radial-gradient(circle,
        rgba(255,121,183,.14),
        transparent 68%);
      transform:translate(-50%,-50%);
      left:-300px;
      top:-300px;
      transition:opacity .3s;
    `;
    document.body.appendChild(glow);

    document.addEventListener("mousemove", e => {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    });
  }

  addDynamicStyles();
}

/* =========================================================
   DYNAMIC STYLE
========================================================= */

function addDynamicStyles() {

  if (document.getElementById("arDynamicStyle")) return;

  const style = document.createElement("style");
  style.id = "arDynamicStyle";

  style.textContent = `
    .card,
    .featured-card {
      transform-style:preserve-3d;
      will-change:transform;
    }

    .card::after {
      content:"";
      position:absolute;
      inset:0;
      pointer-events:none;
      opacity:0;
      background:
        radial-gradient(
          circle at var(--mx,50%) var(--my,50%),
          rgba(255,121,183,.16),
          transparent 35%
        );
      transition:opacity:.25s;
    }

    .card:hover::after {
      opacity:1;
    }

    .story-meta {
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin-top:15px;
    }

    .story-pill {
      padding:6px 10px;
      border-radius:20px;
      background:rgba(255,121,183,.07);
      border:1px solid rgba(255,121,183,.15);
      color:#ff91c7;
      font:10px Arial,sans-serif;
    }

    .reader-tools {
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin:20px 0;
    }

    .reader-tools button {
      border:1px solid #493544;
      background:#18111c;
      color:#eee;
      border-radius:22px;
      padding:9px 13px;
      cursor:pointer;
      transition:.25s;
    }

    .reader-tools button:hover {
      border-color:#ff79b7;
      color:#ff91c7;
      transform:translateY(-2px);
    }

    .continue-reading {
      margin-top:12px;
      color:#ff91c7;
      font:11px Arial,sans-serif;
    }

    .favorite-active {
      color:#ff79b7 !important;
      border-color:#ff79b7 !important;
      box-shadow:0 0 20px rgba(255,121,183,.12);
    }

    .reading-word {
      animation:arWord .35s ease;
    }

    @keyframes arWord {
      from {
        opacity:0;
        transform:translateY(4px);
      }
      to {
        opacity:1;
        transform:none;
      }
    }

    .story-image-card {
      width:100%;
      height:160px;
      object-fit:cover;
      border-radius:15px;
      margin-bottom:15px;
      display:block;
    }

    .empty {
      padding:45px 20px;
      text-align:center;
      color:#9b8c98;
    }

    .empty h3 {
      color:#eee;
    }

    @media(max-width:750px) {
      #cursorGlow {
        display:none;
      }
    }
  `;

  document.head.appendChild(style);
}

/* =========================================================
   TOAST
========================================================= */

function toast(message) {

  const box = document.getElementById("ar-toast");

  if (!box) return;

  box.textContent = message;
  box.style.opacity = "1";
  box.style.transform = "translate(-50%,0)";

  clearTimeout(window.arToastTimer);

  window.arToastTimer = setTimeout(() => {
    box.style.opacity = "0";
    box.style.transform = "translate(-50%,20px)";
  }, 2200);
}

/* =========================================================
   LOAD STORIES
========================================================= */

async function loadStories() {

  if (grid) {
    grid.innerHTML = `
      <div class="empty">
        <h3>Opening the story universe…</h3>
        <p>Please wait.</p>
      </div>
    `;
  }

  const { data, error } = await supabaseClient
    .from("stories")
    .select("*")
    .order("created_at", {
      ascending:false
    });

  if (error) {

    console.error(error);

    if (grid) {
      grid.innerHTML = `
        <div class="empty">
          <h3>Stories load nahi ho paayi.</h3>
          <p>Database connection check karo.</p>
        </div>
      `;
    }

    return;
  }

  stories = data || [];

  updateStoryCount();
  render();
  renderFeatured();
  restoreLastStory();
}

/* =========================================================
   STORY COUNT
========================================================= */

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

  let current = 0;
  const duration = 900;
  const start = performance.now();

  function update(time) {

    const progress =
      Math.min(
        (time - start) / duration,
        1
      );

    current =
      Math.floor(
        target * progress
      );

    element.textContent =
      current;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* =========================================================
   RENDER STORIES
========================================================= */

function render() {

  if (!grid) return;

  const query =
    search
      ? search.value.toLowerCase().trim()
      : "";

  const filtered =
    stories.filter(story => {

      const title =
        String(
          story.title || ""
        ).toLowerCase();

      const body =
        String(
          story.body || ""
        ).toLowerCase();

      const cat =
        String(
          story.category || ""
        );

      return (
        (category === "All" ||
         cat === category) &&
        (
          !query ||
          title.includes(query) ||
          body.includes(query)
        )
      );
    });

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
              class="story-image-card"
              src="${escapeHTML(story.image_url)}"
              alt="${escapeHTML(story.title)}"
              loading="lazy"
            >
          `
          : "";

      const saved =
        isFavorite(story.id);

      return `
        <article
          class="card"
          data-story-id="${escapeHTML(story.id)}">

          ${image}

          <small>
            ${escapeHTML(story.category)}
          </small>

          <h3>
            ${escapeHTML(story.title)}
          </h3>

          <p>
            ${escapeHTML(story.body)}
          </p>

          <div class="story-meta">

            <span class="story-pill">
              ✦ Story
            </span>

            ${
              saved
                ? `<span class="story-pill">♥ Saved</span>`
                : ""
            }

          </div>

          <span class="read">
            Open story →
          </span>

        </article>
      `;

    }).join("");

  attachCardEffects();
}

/* =========================================================
   CARD EFFECT
========================================================= */

function attachCardEffects() {

  document
    .querySelectorAll(".card")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          openReader(
            card.dataset.storyId
          );

        }
      );

      card.addEventListener(
        "mousemove",
        e => {

          const rect =
            card.getBoundingClientRect();

          const x =
            e.clientX - rect.left;

          const y =
            e.clientY - rect.top;

          const rotateY =
            ((x / rect.width) - .5) * 7;

          const rotateX =
            ((y / rect.height) - .5) * -7;

          card.style.transform =
            `
            perspective(900px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            translateY(-7px)
            `;

          card.style.setProperty(
            "--mx",
            `${x}px`
          );

          card.style.setProperty(
            "--my",
            `${y}px`
          );
        }
      );

      card.addEventListener(
        "mouseleave",
        () => {

          card.style.transform =
            "";

        }
      );
    });
}

/* =========================================================
   FEATURED
========================================================= */

function renderFeatured() {

  const box =
    document.getElementById(
      "featuredGrid"
    );

  if (!box) return;

  const featured =
    stories.slice(0,3);

  if (!featured.length) {

    box.innerHTML =
      "<p>Stories coming soon...</p>";

    return;
  }

  box.innerHTML =
    featured.map(story => {

      return `
        <article
          class="featured-card"
          data-story-id="${escapeHTML(story.id)}">

          <small>
            ${escapeHTML(story.category)}
          </small>

          <h3>
            ${escapeHTML(story.title)}
          </h3>

          <p>
            ${escapeHTML(story.body)}
          </p>

          <span class="read">
            Discover →
          </span>

        </article>
      `;

    }).join("");

  box
    .querySelectorAll(".featured-card")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {
          openReader(
            card.dataset.storyId
          );
        }
      );

    });
}

/* =========================================================
   FILTERS
========================================================= */

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
          button.dataset.c;

        render();

        document
          .getElementById("stories")
          ?.scrollIntoView({
            behavior:"smooth",
            block:"start"
          });
      }
    );
  });

/* =========================================================
   SEARCH
========================================================= */

if (search) {

  search.addEventListener(
    "input",
    () => {

      render();

    }
  );
}

/* =========================================================
   READER
========================================================= */

function openReader(id) {

  const story =
    stories.find(
      s =>
        String(s.id) === String(id)
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
      story.body || "";

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

    imageWrap?.classList.add("show");

  } else {

    if (image)
      image.src = "";

    imageWrap?.classList.remove("show");
  }

  addReaderTools();

  const reader =
    document.getElementById("reader");

  if (reader)
    reader.classList.add("show");

  document.body.style.overflow =
    "hidden";

  saveLastStory(story.id);

  updateFavoriteButton();

  setTimeout(
    updateReadingProgress,
    50
  );
}

/* =========================================================
   READER TOOLS
========================================================= */

function addReaderTools() {

  const content =
    document.querySelector(
      ".reader-content"
    );

  if (!content) return;

  let tools =
    document.getElementById(
      "readerTools"
    );

  if (tools) return;

  tools =
    document.createElement("div");

  tools.id =
    "readerTools";

  tools.className =
    "reader-tools";

  tools.innerHTML = `
    <button id="favoriteStory">
      ♡ Save
    </button>

    <button id="shareStory">
      ↗ Share
    </button>

    <button id="continueMusic">
      ♪ Mood Music
    </button>
  `;

  const paragraph =
    document.getElementById("rb");

  paragraph?.before(tools);

  document
    .getElementById("favoriteStory")
    ?.addEventListener(
      "click",
      toggleFavorite
    );

  document
    .getElementById("shareStory")
    ?.addEventListener(
      "click",
      shareCurrentStory
    );

  document
    .getElementById("continueMusic")
    ?.addEventListener(
      "click",
      () => {

        closeReader();

        document
          .getElementById("music")
          ?.scrollIntoView({
            behavior:"smooth"
          });

        toast(
          "Music lounge is ready 🎵"
        );
      }
    );
}

/* =========================================================
   CLOSE READER
========================================================= */

function closeReader() {

  const reader =
    document.getElementById(
      "reader"
    );

  if (reader)
    reader.classList.remove("show");

  document.body.style.overflow =
    "";

  currentStory = null;
}

/* =========================================================
   READING PROGRESS
========================================================= */

function updateReadingProgress() {

  const readerBox =
    document.querySelector(
      ".reader-box"
    );

  const bar =
    document.getElementById(
      "readingProgress"
    );

  if (!readerBox || !bar)
    return;

  readerBox.addEventListener(
    "scroll",
    () => {

      const max =
        readerBox.scrollHeight -
        readerBox.clientHeight;

      if (max <= 0) return;

      const percent =
        (readerBox.scrollTop / max) *
        100;

      bar.style.width =
        Math.min(
          100,
          Math.max(0, percent)
        ) + "%";

    }
  );
}

/* =========================================================
   FAVORITES
========================================================= */

function getFavorites() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "ak_ruru_favorites"
      ) || "[]"
    );

  } catch {

    return [];

  }
}

function isFavorite(id) {

  return getFavorites()
    .map(String)
    .includes(String(id));
}

function toggleFavorite() {

  if (!currentStory) return;

  let favorites =
    getFavorites();

  const id =
    String(currentStory.id);

  if (favorites.includes(id)) {

    favorites =
      favorites.filter(
        x => String(x) !== id
      );

    toast(
      "Story removed from favourites"
    );

  } else {

    favorites.push(id);

    toast(
      "Story saved ♥"
    );
  }

  localStorage.setItem(
    "ak_ruru_favorites",
    JSON.stringify(favorites)
  );

  updateFavoriteButton();
  render();
}

function updateFavoriteButton() {

  const button =
    document.getElementById(
      "favoriteStory"
    );

  if (!button || !currentStory)
    return;

  const saved =
    isFavorite(currentStory.id);

  button.textContent =
    saved
      ? "♥ Saved"
      : "♡ Save";

  button.classList.toggle(
    "favorite-active",
    saved
  );
}

/* =========================================================
   SHARE
========================================================= */

async function shareCurrentStory() {

  if (!currentStory) return;

  const url =
    location.href.split("#")[0] +
    "#story-" +
    currentStory.id;

  const shareData = {
    title:
      currentStory.title ||
      "AkashRuru Story",

    text:
      "Read this story on AkashRuru Stories.",

    url
  };

  try {

    if (
      navigator.share &&
      typeof navigator.share === "function"
    ) {

      await navigator.share(
        shareData
      );

    } else {

      await navigator.clipboard.writeText(
        url
      );

      toast(
        "Story link copied 🔗"
      );
    }

  } catch (error) {

    if (
      error &&
      error.name !== "AbortError"
    ) {
      toast(
        "Share nahi ho paya"
      );
    }
  }
}

/* =========================================================
   SURPRISE ME
========================================================= */

function surpriseMe() {

  if (!stories.length) {

    toast(
      "Abhi koi story available nahi hai."
    );

    return;
  }

  const randomStory =
    stories[
      Math.floor(
        Math.random() *
        stories.length
      )
    ];

  document.body.animate(
    [
      {
        filter:"brightness(1)"
      },
      {
        filter:"brightness(1.7)"
      },
      {
        filter:"brightness(1)"
      }
    ],
    {
      duration:500
    }
  );

  setTimeout(() => {

    openReader(
      randomStory.id
    );

  }, 220);
}

/* =========================================================
   LAST READ
========================================================= */

function saveLastStory(id) {

  localStorage.setItem(
    "ak_ruru_last_story",
    String(id)
  );
}

function restoreLastStory() {

  const id =
    localStorage.getItem(
      "ak_ruru_last_story"
    );

  if (!id) return;

  const story =
    stories.find(
      s => String(s.id) === String(id)
    );

  if (!story) return;

  const about =
    document.getElementById(
      "about"
    );

  if (!about) return;

  let box =
    document.getElementById(
      "continueBox"
    );

  if (!box) {

    box =
      document.createElement(
        "div"
      );

    box.id =
      "continueBox";

    box.className =
      "continue-reading";

    box.innerHTML =
      `
      ↩ Continue reading:
      <button
        style="
          background:none;
          border:0;
          color:#ff91c7;
          cursor:pointer;
          font-weight:bold;
        "
      >
        ${escapeHTML(story.title)}
      </button>
      `;

    about.appendChild(box);

    box
      .querySelector("button")
      .addEventListener(
        "click",
        () => openReader(story.id)
      );
  }
}

/* =========================================================
   MUSIC
========================================================= */

const musicTracks = {

  romantic: [
    {
      name:"Romantic Piano",
      url:
      "https://bxgtcnagqjtfbsztgnmb.supabase.co/storage/v1/object/public/music/solarflex-romantic-495654.mp3"
    }
  ],

  sad: [
    {
      name:"Sad Piano",
      url:
      "https://bxgtcnagqjtfbsztgnmb.supabase.co/storage/v1/object/public/music/soundgallerybydmitrytaras-sad-piano-496878.mp3"
    }
  ],

  horror: [
    {
      name:"Horror Ambience",
      url:
      "https://bxgtcnagqjtfbsztgnmb.supabase.co/storage/v1/object/public/music/atlasaudio-horror-ambience-512255.mp3"
    }
  ],

  calm: [
    {
      name:"Calm Night",
      url:
      "https://bxgtcnagqjtfbsztgnmb.supabase.co/storage/v1/object/public/music/paulyudin-sad-piano-music-376015.mp3"
    }
  ]
};

/* =========================================================
   MOOD
========================================================= */

function setMood(mood) {

  currentMood =
    mood;

  currentTrack =
    0;

  document
    .querySelectorAll(".mood")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.mood === mood
      );

    });

  loadMusic();

  toast(
    mood.charAt(0).toUpperCase() +
    mood.slice(1) +
    " mood activated ✦"
  );
}

/* =========================================================
   LOAD MUSIC
========================================================= */

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
    play.textContent =
      "▶";

  const bar =
    document.getElementById(
      "progressBar"
    );

  if (bar)
    bar.style.width =
      "0%";
}

/* =========================================================
   PLAY
========================================================= */

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
          button.textContent =
            "⏸";

      })
      .catch(error => {

        console.error(error);

        toast(
          "Music play nahi hua."
        );
      });

  } else {

    audio.pause();

    const button =
      document.getElementById(
        "playMusic"
      );

    if (button)
      button.textContent =
        "▶";
  }
}

/* =========================================================
   NEXT / PREVIOUS
========================================================= */

function nextMusic() {

  const tracks =
    musicTracks[currentMood];

  if (!tracks?.length) return;

  currentTrack =
    (currentTrack + 1) %
    tracks.length;

  loadMusic();
}

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

/* =========================================================
   MUSIC BUTTONS
========================================================= */

document
  .querySelectorAll(".mood")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => setMood(
        button.dataset.mood
      )
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

/* =========================================================
   AUDIO PROGRESS
========================================================= */

if (audio) {

  audio.addEventListener(
    "timeupdate",
    () => {

      if (!audio.duration)
        return;

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

/* =========================================================
   MOBILE MENU
========================================================= */

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

/* =========================================================
   READER BACKDROP
========================================================= */

const reader =
  document.getElementById("reader");

if (reader) {

  reader.addEventListener(
    "click",
    event => {

      if (
        event.target === reader
      ) {
        closeReader();
      }

    }
  );
}

/* =========================================================
   ESCAPE
========================================================= */

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

/* =========================================================
   HASH STORY
========================================================= */

function openHashStory() {

  const hash =
    location.hash;

  if (!hash.startsWith("#story-"))
    return;

  const id =
    hash.replace(
      "#story-",
      ""
    );

  const story =
    stories.find(
      s => String(s.id) === String(id)
    );

  if (story)
    openReader(story.id);
}

window.addEventListener(
  "hashchange",
  openHashStory
);

/* =========================================================
   YEAR
========================================================= */

const year =
  document.getElementById("year");

if (year)
  year.textContent =
    new Date().getFullYear();

/* =========================================================
   START
========================================================= */

createExtraUI();

setMood("romantic");

loadStories();
