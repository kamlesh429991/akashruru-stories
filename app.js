const SUPABASE_URL = "https://bxgtcnagqjtfbsztgnmb.supabase.co";
const SUPABASE_KEY = "sb_publishable_mQVSdlF4xEsVtW6eFt-vcQ_jQUVVY7G";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let stories = [];
let category = "All";
let currentStory = null;

/* =========================
   ELEMENTS
========================= */

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const audio = document.getElementById("audio");

/* =========================
   HELPERS
========================= */

function escapeHTML(text) {
  return String(text || "").replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m];
  });
}

function getPreview(text, length = 170) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();

  if (clean.length <= length) return clean;

  return clean.substring(0, length) + "...";
}

/* =========================
   LOAD STORIES
========================= */

async function loadStories() {
  if (grid) {
    grid.innerHTML = `
      <div class="empty">
        <h3>Loading stories...</h3>
        <p>Please wait.</p>
      </div>
    `;
  }

  const { data, error } = await supabaseClient
    .from("stories")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Supabase error:", error);

    if (grid) {
      grid.innerHTML = `
        <div class="empty">
          <h3>Stories load nahi ho paayi.</h3>
          <p>Please refresh the page.</p>
        </div>
      `;
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
  const counter = document.getElementById("storyCount");

  if (counter) {
    animateNumber(counter, stories.length);
  }
}

function animateNumber(element, target) {
  const duration = 800;
  const start = performance.now();

  function update(time) {
    const progress = Math.min(
      (time - start) / duration,
      1
    );

    const value = Math.floor(target * progress);

    element.textContent = value;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* =========================
   RENDER STORIES
========================= */

function render() {
  if (!grid) return;

  const query = search
    ? search.value.toLowerCase().trim()
    : "";

  const filtered = stories.filter(function (story) {
    const title = String(
      story.title || ""
    ).toLowerCase();

    const body = String(
      story.body || ""
    ).toLowerCase();

    const storyCategory = String(
      story.category || ""
    );

    const matchesCategory =
      category === "All" ||
      storyCategory === category;

    const matchesSearch =
      !query ||
      title.includes(query) ||
      body.includes(query) ||
      storyCategory.toLowerCase().includes(query);

    return (
      matchesCategory &&
      matchesSearch
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

  grid.innerHTML = filtered
    .map(function (story, index) {
      const image = story.image_url
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

      return `
        <article
          class="card story-card"
          data-id="${escapeHTML(story.id)}"
          style="animation-delay:${index * 0.05}s"
        >

          ${image}

          <small>
            ${escapeHTML(story.category || "Story")}
          </small>

          <h3>
            ${escapeHTML(story.title || "Untitled Story")}
          </h3>

          <p>
            ${escapeHTML(getPreview(story.body))}
          </p>

          <span class="read">
            Read story →
          </span>

        </article>
      `;
    })
    .join("");

  document
    .querySelectorAll(".story-card")
    .forEach(function (card) {
      card.addEventListener(
        "click",
        function () {
          openReader(card.dataset.id);
        }
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

  const featured = stories.slice(0, 3);

  if (!featured.length) {
    box.innerHTML =
      "<p>Stories coming soon...</p>";

    return;
  }

  box.innerHTML = featured
    .map(function (story, index) {
      return `
        <article
          class="featured-card"
          data-id="${escapeHTML(story.id)}"
          style="animation-delay:${index * 0.1}s"
        >

          <small>
            ${escapeHTML(story.category || "Story")}
          </small>

          <h3>
            ${escapeHTML(story.title || "Untitled Story")}
          </h3>

          <p>
            ${escapeHTML(getPreview(story.body, 150))}
          </p>

          <span class="read">
            Read story →
          </span>

        </article>
      `;
    })
    .join("");

  document
    .querySelectorAll(".featured-card")
    .forEach(function (card) {
      card.addEventListener(
        "click",
        function () {
          openReader(card.dataset.id);
        }
      );
    });
}

/* =========================
   FILTERS
========================= */

document
  .querySelectorAll("#filters button")
  .forEach(function (button) {
    button.addEventListener(
      "click",
      function () {

        document
          .querySelectorAll("#filters button")
          .forEach(function (b) {
            b.classList.remove("on");
          });

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
    function () {
      render();
    }
  );
}

/* =========================
   STORY READER
========================= */

function openReader(id) {
  const story = stories.find(function (s) {
    return String(s.id) === String(id);
  });

  if (!story) return;

  currentStory = story;

  const rc =
    document.getElementById("rc");

  const rt =
    document.getElementById("rt");

  const rb =
    document.getElementById("rb");

  if (rc) {
    rc.textContent =
      story.category || "STORY";
  }

  if (rt) {
    rt.textContent =
      story.title || "Untitled Story";
  }

  if (rb) {
    rb.textContent =
      story.body || "";
  }

  const imageWrap =
    document.getElementById(
      "readerImageWrap"
    );

  const image =
    document.getElementById(
      "readerImage"
    );

  if (story.image_url) {

    if (image) {
      image.src =
        story.image_url;
    }

    if (imageWrap) {
      imageWrap.classList.add("show");
    }

  } else {

    if (image) {
      image.removeAttribute("src");
    }

    if (imageWrap) {
      imageWrap.classList.remove("show");
    }
  }

  const reader =
    document.getElementById("reader");

  if (reader) {
    reader.classList.add("show");
  }

  document.body.style.overflow =
    "hidden";

  resetReadingProgress();
}

/* =========================
   CLOSE READER
========================= */

function closeReader() {
  const reader =
    document.getElementById("reader");

  if (reader) {
    reader.classList.remove("show");
  }

  document.body.style.overflow = "";

  currentStory = null;
}

/* =========================
   READING PROGRESS
========================= */

const readerBox =
  document.querySelector(".reader-box");

if (readerBox) {
  readerBox.addEventListener(
    "scroll",
    function () {

      const progress =
        document.getElementById(
          "readingProgress"
        );

      if (!progress) return;

      const max =
        readerBox.scrollHeight -
        readerBox.clientHeight;

      if (max <= 0) {
        progress.style.width = "100%";
        return;
      }

      const percent =
        (readerBox.scrollTop / max) * 100;

      progress.style.width =
        Math.min(100, percent) + "%";
    }
  );
}

function resetReadingProgress() {
  const progress =
    document.getElementById(
      "readingProgress"
    );

  if (progress) {
    progress.style.width = "0%";
  }

  if (readerBox) {
    readerBox.scrollTop = 0;
  }
}

/* =========================
   SURPRISE ME
========================= */

function surpriseMe() {
  if (!stories.length) {
    alert(
      "Abhi koi story available nahi hai."
    );

    return;
  }

  const randomIndex =
    Math.floor(
      Math.random() * stories.length
    );

  const randomStory =
    stories[randomIndex];

  openReader(randomStory.id);
}

/* =========================
   MUSIC
========================= */

const musicTracks = {

  romantic: [
    {
      name: "Romantic Piano",
      url:
        "https://bxgtcnagqjtfbsztgnmb.supabase.co/storage/v1/object/public/music/solarflex-romantic-495654.mp3"
    }
  ],

  sad: [
    {
      name: "Sad Piano",
      url:
        "https://bxgtcnagqjtfbsztgnmb.supabase.co/storage/v1/object/public/music/soundgallerybydmitrytaras-sad-piano-496878.mp3"
    }
  ],

  horror: [
    {
      name: "Horror Ambience",
      url:
        "https://bxgtcnagqjtfbsztgnmb.supabase.co/storage/v1/object/public/music/atlasaudio-horror-ambience-512255.mp3"
    }
  ],

  calm: [
    {
      name: "Calm Night",
      url:
        "https://bxgtcnagqjtfbsztgnmb.supabase.co/storage/v1/object/public/music/paulyudin-sad-piano-music-376015.mp3"
    }
  ]
};

let currentMood = "romantic";
let currentTrack = 0;

/* =========================
   SET MOOD
========================= */

function setMood(mood) {
  currentMood = mood;
  currentTrack = 0;

  document
    .querySelectorAll(".mood")
    .forEach(function (button) {

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

  if (name) {
    name.textContent =
      track.name;
  }

  if (audio) {
    audio.pause();
    audio.src = track.url;
    audio.load();
  }

  const play =
    document.getElementById(
      "playMusic"
    );

  if (play) {
    play.textContent = "▶";
  }

  const bar =
    document.getElementById(
      "progressBar"
    );

  if (bar) {
    bar.style.width = "0%";
  }
}

/* =========================
   PLAY MUSIC
========================= */

function playMusic() {
  const player =
    document.getElementById("audio");

  const button =
    document.getElementById(
      "playMusic"
    );

  if (!player) {
    alert("Audio player nahi mila.");
    return;
  }

  const tracks =
    musicTracks[currentMood] || [];

  if (
    !tracks.length ||
    !tracks[currentTrack].url
  ) {
    alert(
      "Is mood ka music available nahi hai."
    );

    return;
  }

  if (player.paused) {

    player
      .play()
      .then(function () {

        if (button) {
          button.textContent = "⏸";
        }

      })
      .catch(function (error) {

        console.error(
          "Audio play error:",
          error
        );

        alert(
          "Music play nahi hua."
        );
      });

  } else {

    player.pause();

    if (button) {
      button.textContent = "▶";
    }
  }
}

/* =========================
   NEXT MUSIC
========================= */

function nextMusic() {
  const tracks =
    musicTracks[currentMood];

  if (!tracks || !tracks.length) return;

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

  if (!tracks || !tracks.length) return;

  currentTrack =
    (
      currentTrack -
      1 +
      tracks.length
    ) % tracks.length;

  loadMusic();
}

/* =========================
   MUSIC BUTTONS
========================= */

document
  .querySelectorAll(".mood")
  .forEach(function (button) {

    button.addEventListener(
      "click",
      function () {

        setMood(
          button.dataset.mood
        );

      }
    );
  });

const playButton =
  document.getElementById(
    "playMusic"
  );

if (playButton) {
  playButton.addEventListener(
    "click",
    playMusic
  );
}

const nextButton =
  document.getElementById(
    "nextMusic"
  );

if (nextButton) {
  nextButton.addEventListener(
    "click",
    nextMusic
  );
}

const previousButton =
  document.getElementById(
    "prevMusic"
  );

if (previousButton) {
  previousButton.addEventListener(
    "click",
    previousMusic
  );
}

/* =========================
   AUDIO PROGRESS
========================= */

if (audio) {

  audio.addEventListener(
    "timeupdate",
    function () {

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

      if (bar) {
        bar.style.width =
          percentage + "%";
      }
    }
  );

  audio.addEventListener(
    "ended",
    function () {

      nextMusic();

      if (audio.src) {
        audio
          .play()
          .catch(function () {});
      }
    }
  );
}

/* =========================
   MOBILE MENU
========================= */

const menuBtn =
  document.getElementById(
    "menuBtn"
  );

if (menuBtn) {

  menuBtn.addEventListener(
    "click",
    function () {

      const nav =
        document.querySelector(
          ".nav-links"
        );

      if (nav) {
        nav.classList.toggle(
          "open"
        );
      }
    }
  );
}

/* =========================
   CLOSE READER
========================= */

const reader =
  document.getElementById(
    "reader"
  );

if (reader) {

  reader.addEventListener(
    "click",
    function (event) {

      if (
        event.target === reader
      ) {
        closeReader();
      }
    }
  );
}

/* =========================
   ESC KEY
========================= */

document.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Escape") {
      closeReader();
    }

    if (
      event.key === "/" &&
      document.activeElement !== search
    ) {
      event.preventDefault();

      if (search) {
        search.focus();
      }
    }
  }
);

/* =========================
   YEAR
========================= */

const year =
  document.getElementById(
    "year"
  );

if (year) {
  year.textContent =
    new Date().getFullYear();
}

/* =========================
   LOADER
========================= */

window.addEventListener(
  "load",
  function () {

    setTimeout(function () {

      const loader =
        document.getElementById(
          "loader"
        );

      if (loader) {
        loader.style.pointerEvents =
          "none";
      }

    }, 2000);
  }
);

/* =========================
   START
========================= */

setMood("romantic");

loadStories();
