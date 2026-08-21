const SUPABASE_URL = "https://bxgtcnagqjtfbsztgnmb.supabase.co";
const SUPABASE_KEY = "sb_publishable_mQVSdlF4xEsVtW6eFt-vcQ_jQUVVY7G";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let stories = [];
let category = "All";

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const audio = document.getElementById("audio");


/* =========================
   HELPER
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
   LOAD STORIES
========================= */

async function loadStories() {

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
        "<p>Stories load nahi ho paayi.</p>";
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
    counter.textContent = stories.length;
  }
}


/* =========================
   STORIES
========================= */

function render() {

  if (!grid) return;

  const query =
    search
      ? search.value.toLowerCase().trim()
      : "";

  const filtered =
    stories.filter(function (story) {

      const title =
        String(story.title || "").toLowerCase();

      const body =
        String(story.body || "").toLowerCase();

      return (
        (category === "All" ||
          story.category === category) &&
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
    filtered.map(function (story) {

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
          onclick="openReader('${story.id}')">

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

          <span class="read">
            Read story →
          </span>

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
          onclick="openReader('${story.id}')">

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
          button.dataset.c;

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
}


function closeReader() {

  const reader =
    document.getElementById("reader");

  if (reader) {
    reader.classList.remove("show");
  }

  document.body.style.overflow =
    "";
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

  const player =
    document.getElementById("audio");

  const button =
    document.getElementById("playMusic");


  if (!player) {
    alert("Audio player nahi mila.");
    return;
  }


  const tracks =
    musicTracks[currentMood] || [];


  if (!tracks.length ||
      !tracks[currentTrack].url) {

    alert(
      "Is mood ka music available nahi hai."
    );

    return;
  }


  if (player.paused) {

    player.play()
      .then(function () {

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

        alert(
          "Music play nahi hua."
        );

      });

  } else {

    player.pause();

    if (button) {
      button.textContent =
        "▶";
    }
  }
}


/* =========================
   NEXT
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
   PREVIOUS
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
