const SUPABASE_URL = "https://bxgtcnagqjtfbsztgnmb.supabase.co";
const SUPABASE_KEY = "sb_publishable_mQVSdlF4xEsVtW6eFt-vcQ_jQUVVY7G";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let stories = [];
let category = "All";
let currentStory = null;
let currentFontSize = 16;

const grid = document.getElementById("grid");
const search = document.getElementById("search");


/* =========================
   SECURITY
========================= */

function escapeHTML(text) {
  return String(text || "").replace(/[&<>"']/g, function(m) {
    return {
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
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
    .order("created_at", { ascending:false });

  if (error) {

    console.error(error);

    grid.innerHTML =
      "<p>Stories load nahi ho paayi.</p>";

    return;
  }

  stories = data || [];

  updateStats();

  render();

  renderFeatured();

  renderTrending();
}


/* =========================
   STATS
========================= */

async function updateStats() {

  const storyCount =
    document.getElementById("storyCount");

  const viewCount =
    document.getElementById("viewCount");

  const likeCount =
    document.getElementById("likeCount");


  if (storyCount) {
    storyCount.textContent =
      stories.length;
  }


  const { count: views } =
    await supabaseClient
      .from("story_views")
      .select("*", {
        count:"exact",
        head:true
      });

  if (viewCount) {
    viewCount.textContent =
      views || 0;
  }


  const { count: likes } =
    await supabaseClient
      .from("story_likes")
      .select("*", {
        count:"exact",
        head:true
      });

  if (likeCount) {
    likeCount.textContent =
      likes || 0;
  }
}


/* =========================
   STORY CARDS
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

      const cat =
        String(story.category || "");


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


  grid.innerHTML =
    filtered.length

      ? filtered.map(function(story) {

          const image =
            story.image_url
              ? `
                <img
                  class="card-photo"
                  src="${escapeHTML(story.image_url)}"
                  alt="${escapeHTML(story.title)}"
                  loading="lazy"
                >
              `
              : "";


          const words =
            String(story.body || "")
              .trim()
              .split(/\s+/)
              .length;

          const readingTime =
            Math.max(1, Math.ceil(words / 180));


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

                <div class="card-meta">

                  <span>
                    ⏱ ${readingTime} min read
                  </span>

                  <span class="read">
                    Read →
                  </span>

                </div>

              </div>

            </article>

          `;

        }).join("")

      : "<p>No stories found.</p>";
}


/* =========================
   FILTERS
========================= */

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

      category =
        button.dataset.c;

      render();
    };

  });


/* =========================
   SEARCH
========================= */

if (search) {
  search.oninput = render;
}


/* =========================
   FEATURED STORY
========================= */

function renderFeatured() {

  const box =
    document.getElementById("featuredBox");

  if (!box || !stories.length)
    return;


  const story = stories[0];

  const image =
    story.image_url
      ? `
        <img
          src="${escapeHTML(story.image_url)}"
          alt="${escapeHTML(story.title)}"
        >
      `
      : `
        <div class="featured-placeholder">
          ❤️
        </div>
      `;


  box.innerHTML = `

    <div
      class="featured-card"
      onclick="openReader('${story.id}')"
    >

      ${image}

      <div class="featured-content">

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
          Read Story →
        </span>

      </div>

    </div>

  `;
}


/* =========================
   TRENDING
========================= */

async function renderTrending() {

  const container =
    document.getElementById("trendingGrid");

  if (!container)
    return;


  const counts = {};

  const { data } =
    await supabaseClient
      .from("story_views")
      .select("story_id");


  (data || []).forEach(function(row) {

    counts[row.story_id] =
      (counts[row.story_id] || 0) + 1;

  });


  const trending =
    [...stories]
      .sort(function(a,b) {

        return (
          (counts[b.id] || 0) -
          (counts[a.id] || 0)
        );

      })
      .slice(0,3);


  container.innerHTML =
    trending.length

      ? trending.map(function(story) {

          const image =
            story.image_url
              ? `
                <img
                  src="${escapeHTML(story.image_url)}"
                  alt=""
                >
              `
              : "";


          return `

            <article
              class="mini-card"
              onclick="openReader('${story.id}')"
            >

              ${image}

              <div class="mini-content">

                <small>
                  ${escapeHTML(story.category)}
                </small>

                <h3>
                  ${escapeHTML(story.title)}
                </h3>

                <span>
                  👀 ${counts[story.id] || 0} reads
                </span>

              </div>

            </article>

          `;

        }).join("")

      : "<p>No stories yet.</p>";
}


/* =========================
   OPEN READER
========================= */

async function openReader(id) {

  const story =
    stories.find(function(s) {
      return String(s.id) === String(id);
    });


  if (!story)
    return;


  currentStory = story;


  document.getElementById("rc").textContent =
    story.category || "Story";


  document.getElementById("rt").textContent =
    story.title || "";


  document.getElementById("rb").textContent =
    story.body || "";


  const readerImage =
    document.getElementById("readerImage");


  if (story.image_url) {

    readerImage.src =
      story.image_url;

    readerImage.style.display =
      "block";

  } else {

    readerImage.removeAttribute("src");

    readerImage.style.display =
      "none";
  }


  document
    .getElementById("reader")
    .classList.add("show");


  currentFontSize = 16;

  document.getElementById("rb").style.fontSize =
    currentFontSize + "px";


  await addView(story.id);

  await updateLikeCount(story.id);

  await loadComments(story.id);
}


/* =========================
   CLOSE READER
========================= */

function closeReader() {

  document
    .getElementById("reader")
    .classList.remove("show");

  currentStory = null;
}


document.addEventListener(
  "keydown",
  function(e) {

    if (e.key === "Escape") {
      closeReader();
    }

  }
);


/* =========================
   VIEWS
========================= */

async function addView(storyId) {

  const viewedKey =
    "viewed_" + storyId;


  if (sessionStorage.getItem(viewedKey))
    return;


  const { error } =
    await supabaseClient
      .from("story_views")
      .insert({
        story_id: storyId
      });


  if (!error) {

    sessionStorage.setItem(
      viewedKey,
      "1"
    );

    updateStats();

    renderTrending();
  }
}


/* =========================
   LIKE
========================= */

const likeBtn =
  document.getElementById("likeBtn");


if (likeBtn) {

  likeBtn.onclick =
    async function() {

      if (!currentStory)
        return;


      const key =
        "liked_" + currentStory.id;


      if (localStorage.getItem(key)) {

        alert("You already liked this story ❤️");

        return;
      }


      const { error } =
        await supabaseClient
          .from("story_likes")
          .insert({
            story_id: currentStory.id
          });


      if (error) {

        console.error(error);

        alert("Like nahi ho paaya.");

        return;
      }


      localStorage.setItem(
        key,
        "1"
      );


      await updateLikeCount(
        currentStory.id
      );

      updateStats();
    };
}


/* =========================
   LIKE COUNT
========================= */

async function updateLikeCount(storyId) {

  const { count } =
    await supabaseClient
      .from("story_likes")
      .select("*", {
        count:"exact",
        head:true
      })
      .eq("story_id", storyId);


  const element =
    document.getElementById("readerLikes");


  if (element) {

    element.textContent =
      count || 0;
  }
}


/* =========================
   BOOKMARK
========================= */

const bookmarkBtn =
  document.getElementById("bookmarkBtn");


if (bookmarkBtn) {

  bookmarkBtn.onclick =
    async function() {

      if (!currentStory)
        return;


      const key =
        "bookmark_" + currentStory.id;


      if (localStorage.getItem(key)) {

        alert("Already bookmarked 🔖");

        return;
      }


      const { error } =
        await supabaseClient
          .from("story_bookmarks")
          .insert({
            story_id: currentStory.id
          });


      if (error) {

        console.error(error);

        alert("Bookmark nahi ho paaya.");

        return;
      }


      localStorage.setItem(
        key,
        "1"
      );


      bookmarkBtn.textContent =
        "🔖 Bookmarked";

    };
}


/* =========================
   SHARE
========================= */

const shareBtn =
  document.getElementById("shareBtn");


if (shareBtn) {

  shareBtn.onclick =
    async function() {

      if (!currentStory)
        return;


      const shareData = {

        title:
          currentStory.title,

        text:
          "Read this story on AkashRuru Stories ❤️",

        url:
          window.location.href

      };


      try {

        if (navigator.share) {

          await navigator.share(
            shareData
          );

        } else {

          await navigator.clipboard
            .writeText(
              window.location.href
            );

          alert(
            "Story link copied! ❤️"
          );
        }

      } catch(error) {

        console.log(error);

      }

    };
}


/* =========================
   COMMENTS
========================= */

const commentBtn =
  document.getElementById("commentBtn");


if (commentBtn) {

  commentBtn.onclick =
    async function() {

      if (!currentStory)
        return;


      const name =
        document
          .getElementById("commentName")
          .value
          .trim();


      const comment =
        document
          .getElementById("commentText")
          .value
          .trim();


      if (!comment) {

        alert(
          "Comment likho pehle."
        );

        return;
      }


      if (comment.length > 1000) {

        alert(
          "Comment bahut bada hai."
        );

        return;
      }


      const { error } =
        await supabaseClient
          .from("story_comments")
          .insert({

            story_id:
              currentStory.id,

            name:
              name || "Anonymous",

            comment:
              comment

          });


      if (error) {

        console.error(error);

        alert(
          "Comment post nahi hua."
        );

        return;
      }


      document
        .getElementById("commentName")
        .value = "";


      document
        .getElementById("commentText")
        .value = "";


      loadComments(
        currentStory.id
      );

    };
}


/* =========================
   LOAD COMMENTS
========================= */

async function loadComments(storyId) {

  const list =
    document.getElementById(
      "commentsList"
    );


  if (!list)
    return;


  list.innerHTML =
    "<p>Loading comments...</p>";


  const { data, error } =
    await supabaseClient
      .from("story_comments")
      .select("*")
      .eq("story_id", storyId)
      .order(
        "created_at",
        {
          ascending:false
        }
      );


  if (error) {

    list.innerHTML =
      "<p>Comments load nahi hue.</p>";

    return;
  }


  if (!data.length) {

    list.innerHTML =
      "<p>No comments yet. Be the first ❤️</p>";

    return;
  }


  list.innerHTML =
    data.map(function(item) {

      return `

        <div class="comment">

          <strong>
            ${escapeHTML(item.name)}
          </strong>

          <p>
            ${escapeHTML(item.comment)}
          </p>

        </div>

      `;

    }).join("");
}


/* =========================
   FONT SIZE
========================= */

const fontMinus =
  document.getElementById("fontMinus");

const fontPlus =
  document.getElementById("fontPlus");


if (fontMinus) {

  fontMinus.onclick =
    function() {

      currentFontSize =
        Math.max(
          12,
          currentFontSize - 2
        );


      document.getElementById("rb")
        .style.fontSize =
        currentFontSize + "px";

    };
}


if (fontPlus) {

  fontPlus.onclick =
    function() {

      currentFontSize =
        Math.min(
          26,
          currentFontSize + 2
        );


      document.getElementById("rb")
        .style.fontSize =
        currentFontSize + "px";

    };
}


/* =========================
   READING PROGRESS
========================= */

const readerBox =
  document.querySelector(
    ".reader-box"
  );


if (readerBox) {

  readerBox.addEventListener(
    "scroll",
    function() {

      const progress =
        document.getElementById(
          "readerProgress"
        );


      const scrollTop =
        readerBox.scrollTop;


      const scrollHeight =
        readerBox.scrollHeight -
        readerBox.clientHeight;


      const percent =
        scrollHeight > 0
          ? (scrollTop / scrollHeight) * 100
          : 0;


      progress.style.width =
        percent + "%";

    }
  );
}


/* =========================
   RANDOM STORY
========================= */

const randomBtn =
  document.getElementById("randomBtn");


if (randomBtn) {

  randomBtn.onclick =
    function() {

      if (!stories.length)
        return;


      const random =
        stories[
          Math.floor(
            Math.random() *
            stories.length
          )
        ];


      openReader(random.id);

    };
}


/* =========================
   SUBMIT STORY
========================= */

const submitStoryBtn =
  document.getElementById(
    "submitStoryBtn"
  );


if (submitStoryBtn) {

  submitStoryBtn.onclick =
    function() {

      alert(
        "Apni story submit karne ke liye Admin se contact karein. ❤️"
      );

    };
}


/* =========================
   MUSIC
========================= */

let audioContext = null;
let musicPlaying = false;
let musicTimer = null;


const musicBtn =
  document.getElementById(
    "musicBtn"
  );


function createMusic() {

  audioContext =
    new (
      window.AudioContext ||
      window.webkitAudioContext
    )();


  const master =
    audioContext.createGain();


  master.gain.value =
    0.035;


  master.connect(
    audioContext.destination
  );


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

    if (!musicPlaying)
      return;


    const oscillator =
      audioContext.createOscillator();


    const gain =
      audioContext.createGain();


    oscillator.type =
      "sine";


    oscillator.frequency.value =
      notes[
        index %
        notes.length
      ];


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
      setTimeout(
        playNote,
        900
      );
  }


  playNote();
}


if (musicBtn) {

  musicBtn.onclick =
    function() {

      if (!musicPlaying) {

        musicPlaying = true;


        if (!audioContext) {

          createMusic();

        }


        if (
          audioContext.state ===
          "suspended"
        ) {

          audioContext.resume();

        }


        musicBtn.textContent =
          "⏸ Pause Music";

      } else {

        musicPlaying = false;


        clearTimeout(
          musicTimer
        );


        musicBtn.textContent =
          "🎵 Play Music";

      }

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
   START
========================= */

loadStories();
