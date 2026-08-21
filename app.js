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
const audio = document.getElementById("audio");

const musicTracks = {
  romantic: [
    {
      name: "Romantic Piano",
      url: ""
    }
  ],
  sad: [
    {
      name: "Sad Piano",
      url: ""
    }
  ],
  horror: [
    {
      name: "Dark Atmosphere",
      url: ""
    }
  ],
  calm: [
    {
      name: "Calm Night",
      url: ""
    }
  ]
};

let currentMood = "romantic";
let currentTrack = 0;


/* =========================
   SECURITY
========================= */

function escapeHTML(text) {
  return String(text || "").replace(
    /[&<>"']/g,
    function(m) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[m];
    }
  );
}


/* =========================
   LOAD STORIES
========================= */

async function loadStories() {

  const { data, error } =
    await supabaseClient
      .from("stories")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.error(error);

    grid.innerHTML =
      "<p>Stories load nahi ho paayi.</p>";

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

    counter.textContent =
      stories.length;
  }
}


/* =========================
   RENDER STORIES
========================= */

function render() {

  const query =
    search
      ? search.value.toLowerCase().trim()
      : "";


  const filtered =
    stories.filter(function(story) {

      const title =
        String(story.title || "")
          .toLowerCase();

      const body =
        String(story.body || "")
          .toLowerCase();


      return (
        (category === "All" ||
          story.category === category)
        &&
        (
          !query ||
          title.includes(query) ||
          body.includes(query)
        )
      );

    });


  if (!filtered.length) {

    grid.innerHTML =
      `
      <div class="empty">
        <h3>No stories found</h3>
        <p>Try another category or search.</p>
      </div>
      `;

    return;
  }


  grid.innerHTML =
    filtered.map(function(story) {

      const image =
        story.image_url
          ? `
            <img
              src="${escapeHTML(story.image_url)}"
              alt=""
              style="
                width:100%;
                height:150px;
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
   FEATURED STORIES
========================= */

function renderFeatured() {

  const container =
    document.getElementById("featuredGrid");

  if (!container) return;


  const featured =
    stories.slice(0, 3);


  if (!featured.length) {

    container.innerHTML =
      "<p>Stories coming soon...</p>";

    return;
  }


  container.innerHTML =
    featured.map(function(story) {

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
  .forEach(function(button) {

    button.onclick =
      function() {

        document
          .querySelectorAll("#filters button")
          .forEach(function(b) {

            b.classList.remove("on");

          });


        button.classList.add("on");

        category =
          button.dataset.c;

        render();
      };

  });


/* =========================
   SEARCH
========================= */

if (search) {

  search.oninput =
    function() {

      render();

    };

}


/* =========================
   STORY READER
========================= */

function openReader(id) {

  const story =
    stories.find(function(s) {

      return String(s.id) ===
        String(id);

    });


  if (!story) return;


  document.getElementById("rc")
    .textContent =
      story.category || "";


  document.getElementById("rt")
    .textContent =
      story.title || "";


  document.getElementById("rb")
    .textContent =
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

    image.src =
      story.image_url;

    imageWrap.classList.add("show");

  } else {

    image.src = "";

    imageWrap.classList.remove("show");

  }


  document
    .getElementById("reader")
    .classList.add("show");


  document.body.style.overflow =
    "hidden";
}


function closeReader() {

  document
    .getElementById("reader")
    .classList.remove("show");


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
   MUSIC
========================= */

function setMood(mood) {

  currentMood = mood;

  currentTrack = 0;


  document
    .querySelectorAll(".mood")
    .forEach(function(button) {

      button.classList.toggle(
        "active",
        button.dataset.mood === mood
      );

    });


  loadMusic();

}


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

    audio.src =
      track.url;

    audio.load();

  }

}


function playMusic() {

  if (!audio || !audio.src) {

    alert(
      "Music file abhi add nahi ki gayi hai."
    );

    return;
  }


  if (audio.paused) {

    audio.play();

    document.getElementById(
      "playMusic"
    ).textContent =
      "⏸";

  } else {

    audio.pause();

    document.getElementById(
      "playMusic"
    ).textContent =
      "▶";

  }

}


function nextMusic() {

  const tracks =
    musicTracks[currentMood];


  if (!tracks.length) return;


  currentTrack =
    (currentTrack + 1) %
    tracks.length;


  loadMusic();

}


function previousMusic() {

  const tracks =
    musicTracks[currentMood];


  if (!tracks.length) return;


  currentTrack =
    (currentTrack - 1 + tracks.length) %
    tracks.length;


  loadMusic();

}


/* MUSIC MOODS */

document
  .querySelectorAll(".mood")
  .forEach(function(button) {

    button.onclick =
      function() {

        setMood(
          button.dataset.mood
        );

      };

  });


const playButton =
  document.getElementById(
    "playMusic"
  );


if (playButton) {

  playButton.onclick =
    playMusic;

}


const nextButton =
  document.getElementById(
    "nextMusic"
  );


if (nextButton) {

  nextButton.onclick =
    nextMusic;

}


const previousButton =
  document.getElementById(
    "prevMusic"
  );


if (previousButton) {

  previousButton.onclick =
    previousMusic;

}


/* =========================
   AUDIO PROGRESS
========================= */

if (audio) {

  audio.addEventListener(
    "timeupdate",
    function() {

      if (!audio.duration)
        return;


      const percent =
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
          percent + "%";

      }

    }
  );


  audio.addEventListener(
    "ended",
    function() {

      nextMusic();

      if (audio.src) {

        audio.play().catch(
          function() {}
        );

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

  menuBtn.onclick =
    function() {

      document
        .querySelector(".nav-links")
        .classList.toggle(
          "open"
        );

    };

}


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
   READER ESCAPE
========================= */

document.addEventListener(
  "keydown",
  function(e) {

    if (
      e.key === "Escape"
    ) {

      closeReader();

    }

  }
);


/* =========================
   START
========================= */

loadStories();

setMood("romantic");
