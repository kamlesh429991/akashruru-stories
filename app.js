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
  return String(text || "").replace(/[&<>"']/g, function(m) {
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
    grid.innerHTML =
      "<p>Stories load nahi ho paayi.</p>";
    return;
  }

  stories = data || [];
  render();
}


function render() {

  const query = search
    ? search.value.toLowerCase().trim()
    : "";

  const filtered = stories.filter(function(story) {

    const title = String(story.title || "").toLowerCase();
    const body = String(story.body || "").toLowerCase();

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


  grid.innerHTML = filtered.length

    ? filtered.map(function(story) {

        const image = story.image_url
          ? `
            <img
              class="card-photo"
              src="${escapeHTML(story.image_url)}"
              alt="${escapeHTML(story.title)}"
              loading="lazy"
            >
          `
          : "";

        return `
          <article
            class="card"
            onclick="openReader('${story.id}')"
          >

            ${image}

            <div class="card-content">

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

            </div>

          </article>
        `;

      }).join("")

    : "<p>No stories found.</p>";
}


/* CATEGORY FILTER */

document
  .querySelectorAll("#filters button")
  .forEach(function(button) {

    button.onclick = function() {

      document
        .querySelectorAll("#filters button")
        .forEach(function(b) {
          b.classList.remove("on");
        });

      button.classList.add("on");

      category = button.dataset.c;

      render();
    };

  });


/* SEARCH */

if (search) {
  search.oninput = render;
}


/* STORY READER */

function openReader(id) {

  const story = stories.find(function(s) {
    return String(s.id) === String(id);
  });

  if (!story) return;

  document.getElementById("rc").textContent =
    story.category || "Story";

  document.getElementById("rt").textContent =
    story.title || "";

  document.getElementById("rb").textContent =
    story.body || "";

  const readerImage =
    document.getElementById("readerImage");

  if (story.image_url) {

    readerImage.src = story.image_url;
    readerImage.style.display = "block";

  } else {

    readerImage.removeAttribute("src");
    readerImage.style.display = "none";
  }

  document
    .getElementById("reader")
    .classList.add("show");


  /* SHARE */

  const shareBtn =
    document.getElementById("shareBtn");

  shareBtn.onclick = async function() {

    const shareData = {
      title: story.title,
      text: "Read this story on AkashRuru Stories ❤️",
      url: window.location.href
    };

    try {

      if (navigator.share) {

        await navigator.share(shareData);

      } else {

        await navigator.clipboard.writeText(
          window.location.href
        );

        alert("Story link copied! ❤️");
      }

    } catch (error) {
      console.log(error);
    }
  };
}


function closeReader() {

  document
    .getElementById("reader")
    .classList.remove("show");
}


/* ESC TO CLOSE */

document.addEventListener("keydown", function(e) {

  if (e.key === "Escape") {
    closeReader();
  }

});


/* YEAR */

if (document.getElementById("year")) {

  document.getElementById("year").textContent =
    new Date().getFullYear();

}


/* =========================
   SOFT BACKGROUND MUSIC
   ========================= */

let audioContext = null;
let musicPlaying = false;
let musicTimer = null;

const musicBtn =
  document.getElementById("musicBtn");


function createMusic() {

  audioContext =
    new (window.AudioContext ||
         window.webkitAudioContext)();

  const master =
    audioContext.createGain();

  master.gain.value = 0.035;

  master.connect(audioContext.destination);

  const notes = [
    261.63,
    329.63,
    392.00,
    329.63,
    293.66,
    349.23,
    440.00,
    349.23
  ];

  let index = 0;

  function playNote() {

    if (!musicPlaying) return;

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.value =
      notes[index % notes.length];

    gain.gain.setValueAtTime(
      0,
      audioContext.currentTime
    );

    gain.gain.linearRampToValueAtTime(
      0.6,
      audioContext.currentTime + 0.5
    );

    gain.gain.linearRampToValueAtTime(
      0,
      audioContext.currentTime + 2.5
    );

    oscillator.connect(gain);
    gain.connect(master);

    oscillator.start();

    oscillator.stop(
      audioContext.currentTime + 2.6
    );

    index++;

    musicTimer =
      setTimeout(playNote, 900);
  }

  playNote();
}


if (musicBtn) {

  musicBtn.onclick = function() {

    if (!musicPlaying) {

      musicPlaying = true;

      if (!audioContext) {
        createMusic();
      }

      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      musicBtn.textContent =
        "⏸ Pause Music";

    } else {

      musicPlaying = false;

      clearTimeout(musicTimer);

      musicBtn.textContent =
        "🎵 Play Music";
    }
  };
}


/* START */

loadStories();
