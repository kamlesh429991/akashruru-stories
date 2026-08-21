const SUPABASE_URL = "https://bxgtcnagqjtfbsztgnmb.supabase.co";
const SUPABASE_KEY = "sb_publishable_mQVSdlF4xEsVtW6eFt-vcQ_jQUVVY7G";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let stories = [];
let category = "All";
let currentStory = null;

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const audio = document.getElementById("audio");


/* =========================
   SECURITY
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


/* =========================
   LOCAL STORAGE
========================= */

function getFavorites() {
  return JSON.parse(
    localStorage.getItem("akashruru_favorites") || "[]"
  );
}

function saveFavorites(data) {
  localStorage.setItem(
    "akashruru_favorites",
    JSON.stringify(data)
  );
}

function getBookmarks() {
  return JSON.parse(
    localStorage.getItem("akashruru_bookmarks") || "[]"
  );
}

function saveBookmarks(data) {
  localStorage.setItem(
    "akashruru_bookmarks",
    JSON.stringify(data)
  );
}


/* =========================
   LOAD STORIES
========================= */

async function loadStories() {

  if (!grid) return;

  grid.innerHTML = `
    <div class="empty">
      <h3>Loading stories...</h3>
      <p>Please wait.</p>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from("stories")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(error);

    grid.innerHTML = `
      <div class="empty">
        <h3>Stories load nahi ho paayi.</h3>
        <p>Please refresh the page.</p>
      </div>
    `;

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
    counter.textContent = stories.length;
  }
}


/* =========================
   RENDER STORIES
========================= */

function render() {

  if (!grid) return;

  const query =
    search
      ? search.value.toLowerCase().trim()
      : "";

  const favorites = getFavorites();
  const bookmarks = getBookmarks();

  const filtered = stories.filter(function (story) {

    const title =
      String(story.title || "").toLowerCase();

    const body =
      String(story.body || "").toLowerCase();

    const matchesCategory =
      category === "All" ||
      story.category === category;

    const matchesSearch =
      !query ||
      title.includes(query) ||
      body.includes(query);

    return matchesCategory && matchesSearch;
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
    filtered.map(function (story) {

      const isFavorite =
        favorites.includes(String(story.id));

      const isBookmark =
        bookmarks.includes(String(story.id));

      const image =
        story.image_url
          ? `
            <img
              src="${escapeHTML(story.image_url)}"
              alt="${escapeHTML(story.title)}"
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
          class="card"
          data-story-id="${escapeHTML(story.id)}"
          onclick="openReader('${escapeHTML(story.id)}')">

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

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-top:12px;
          ">

            <span class="read">
              Read story →
            </span>

            <div style="
              display:flex;
              gap:7px;
            ">

              <button
                type="button"
                onclick="event.stopPropagation();toggleFavorite('${escapeHTML(story.id)}')"
                aria-label="Favorite"
                style="
                  border:0;
                  background:transparent;
                  color:${isFavorite ? "#ff79b7" : "#8f818d"};
                  font-size:20px;
                  cursor:pointer;
                ">
                ${isFavorite ? "♥" : "♡"}
              </button>

              <button
                type="button"
                onclick="event.stopPropagation();toggleBookmark('${escapeHTML(story.id)}')"
                aria-label="Bookmark"
                style="
                  border:0;
                  background:transparent;
                  color:${isBookmark ? "#ff79b7" : "#8f818d"};
                  font-size:18px;
                  cursor:pointer;
                ">
                ${isBookmark ? "🔖" : "🏷"}
              </button>

            </div>

          </div>

        </article>
      `;

    }).join("");
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
    featured.map(function (story) {

      return `
        <article
          class="featured-card"
          onclick="openReader('${escapeHTML(story.id)}')">

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
            Read story →
          </span>

        </article>
      `;

    }).join("");
}


/* =========================
   FAVORITES
========================= */

function toggleFavorite(id) {

  id = String(id);

  let favorites = getFavorites();

  if (favorites.includes(id)) {

    favorites =
      favorites.filter(function (x) {
        return x !== id;
      });

    showToast("Removed from favorites");

  } else {

    favorites.push(id);

    showToast("❤️ Added to favorites");
  }

  saveFavorites(favorites);

  render();
}


/* =========================
   BOOKMARK
========================= */

function toggleBookmark(id) {

  id = String(id);

  let bookmarks = getBookmarks();

  if (bookmarks.includes(id)) {

    bookmarks =
      bookmarks.filter(function (x) {
        return x !== id;
      });

    showToast("Bookmark removed");

  } else {

    bookmarks.push(id);

    showToast("🔖 Story bookmarked");
  }

  saveBookmarks(bookmarks);

  render();
}


/* =========================
   TOAST
========================= */

function showToast(message) {

  let toast =
    document.getElementById("akashToast");

  if (!toast) {

    toast =
      document.createElement("div");

    toast.id =
      "akashToast";

    toast.style.cssText = `
      position:fixed;
      left:50%;
      bottom:30px;
      transform:translateX(-50%);
      background:#17101b;
      color:#fff;
      border:1px solid #54384d;
      padding:12px 18px;
      border-radius:30px;
      z-index:99999;
      font:13px Arial,sans-serif;
      box-shadow:0 15px 50px rgba(0,0,0,.5);
      transition:.3s;
    `;

    document.body.appendChild(toast);
  }

  toast.textContent =
    message;

  toast.style.opacity =
    "1";

  clearTimeout(
    window.toastTimer
  );

  window.toastTimer =
    setTimeout(function () {

      toast.style.opacity =
        "0";

    }, 1800);
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

  const story =
    stories.find(function (s) {
      return String(s.id) === String(id);
    });

  if (!story) return;

  currentStory =
    story;


  const rc =
    document.getElementById("rc");

  const rt =
    document.getElementById("rt");

  const rb =
    document.getElementById("rb");


  if (rc) {
    rc.textContent =
      story.category || "";
  }

  if (rt) {
    rt.textContent =
      story.title || "";
  }

  if (rb) {
    rb.textContent =
      story.body || "";
  }


  const imageWrap =
    document.getElementById("readerImageWrap");

  const image =
    document.getElementById("readerImage");


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
      image.src = "";
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


  updateReadingProgress();

  restoreReadingPosition();
}


/* =========================
   CLOSE READER
========================= */

function closeReader() {

  saveReadingPosition();

  const reader =
    document.getElementById("reader");

  if (reader) {
    reader.classList.remove("show");
  }

  document.body.style.overflow =
    "";
}


/* =========================
   READING POSITION
========================= */

function saveReadingPosition() {

  if (!currentStory) return;

  const readerBox =
    document.querySelector(".reader-box");

  if (!readerBox) return;

  localStorage.setItem(
    "reading_" + currentStory.id,
    readerBox.scrollTop
  );
}


function restoreReadingPosition() {

  if (!currentStory) return;

  const readerBox =
    document.querySelector(".reader-box");

  if (!readerBox) return;

  const saved =
    localStorage.getItem(
      "reading_" + currentStory.id
    );

  setTimeout(function () {

    readerBox.scrollTop =
      saved ? Number(saved) : 0;

    updateReadingProgress();

  }, 50);
}


/* =========================
   READING PROGRESS
========================= */

function updateReadingProgress() {

  const readerBox =
    document.querySelector(".reader-box");

  const bar =
    document.getElementById("readingProgress");

  if (!readerBox || !bar) return;

  const max =
    readerBox.scrollHeight -
    readerBox.clientHeight;

  if (max <= 0) {

    bar.style.width =
      "100%";

    return;
  }

  const percentage =
    (readerBox.scrollTop / max) * 100;

  bar.style.width =
    Math.min(100, Math.max(0, percentage)) + "%";
}


const readerBox =
  document.querySelector(".reader-box");

if (readerBox) {

  readerBox.addEventListener(
    "scroll",
    function () {

      updateReadingProgress();

      clearTimeout(
        window.readingSaveTimer
      );

      window.readingSaveTimer =
        setTimeout(
          saveReadingPosition,
          300
        );
    }
  );
}


/* =========================
   SURPRISE ME
========================= */

function surpriseMe() {

  if (!stories.length) {

    showToast(
      "Abhi koi story available nahi hai."
    );

    return;
  }


  const randomIndex =
    Math.floor(
      Math.random() * stories.length
    );


  openReader(
    stories[randomIndex].id
  );
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


let currentMood =
  "romantic";

let currentTrack =
  0;


/* =========================
   SET MOOD
========================= */

function setMood(mood) {

  currentMood =
    mood;

  currentTrack =
    0;


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
    document.getElementById("trackName");


  if (name) {
    name.textContent =
      track.name;
  }


  if (audio) {

    audio.pause();

    audio.src =
      track.url;

    audio.load();
  }


  const play =
    document.getElementById("playMusic");


  if (play) {
    play.textContent =
      "▶";
  }
}


/* =========================
   PLAY MUSIC
========================= */

function playMusic() {

  if (!audio) return;


  if (audio.paused) {

    audio.play()
      .then(function () {

        const button =
          document.getElementById(
            "playMusic"
          );

        if (button) {
          button.textContent =
            "⏸";
        }

      })
      .catch(function (error) {

        console.error(
          "Audio play error:",
          error
        );

        showToast(
          "Music play nahi hua."
        );

      });

  } else {

    audio.pause();

    const button =
      document.getElementById(
        "playMusic"
      );

    if (button) {
      button.textContent =
        "▶";
    }
  }
}


/* =========================
   NEXT MUSIC
========================= */

function nextMusic() {

  const tracks =
    musicTracks[currentMood];

  if (!tracks ||
      !tracks.length) return;


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

  if (!tracks ||
      !tracks.length) return;


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
  document.getElementById("playMusic");

if (playButton) {

  playButton.addEventListener(
    "click",
    playMusic
  );

}


const nextButton =
  document.getElementById("nextMusic");

if (nextButton) {

  nextButton.addEventListener(
    "click",
    nextMusic
  );

}


const previousButton =
  document.getElementById("prevMusic");

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

        audio.play()
          .catch(function () {});

      }

    }
  );

}


/* =========================
   MOBILE MENU
========================= */

const menuBtn =
  document.getElementById("menuBtn");

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
  document.getElementById("reader");

if (reader) {

  reader.addEventListener(
    "click",
    function (event) {

      if (event.target === reader) {
        closeReader();
      }

    }
  );

}


/* =========================
   ESC
========================= */

document.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Escape") {
      closeReader();
    }

  }
);


/* =========================
   YEAR
========================= */

const year =
  document.getElementById("year");

if (year) {

  year.textContent =
    new Date().getFullYear();

}


/* =========================
   START
========================= */

setMood("romantic");

loadStories();
