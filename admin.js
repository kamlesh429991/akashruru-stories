const SUPABASE_URL = "https://bxgtcnagqjtfbsztgnmb.supabase.co";
const SUPABASE_KEY = "sb_publishable_mQVSdlF4xEsVtW6eFt-vcQ_jQUVVY7G";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const STORAGE_BUCKET = "story-images";

let editingId = null;


/* =========================
   LOGIN
========================= */

async function login() {

  const email =
    document.getElementById("email")?.value.trim();

  const password =
    document.getElementById("pass").value;

  const err =
    document.getElementById("err");


  if (!email) {

    err.textContent =
      "Email enter karo.";

    return;
  }


  const { error } =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });


  if (error) {

    err.textContent =
      error.message;

    return;
  }


  err.textContent = "";

  showDashboard();
}


/* =========================
   LOGOUT
========================= */

async function logout() {

  await supabaseClient.auth.signOut();

  location.reload();
}


/* =========================
   DASHBOARD
========================= */

async function showDashboard() {

  const {
    data: {
      session
    }
  } =
    await supabaseClient.auth.getSession();


  if (!session) {

    document
      .getElementById("login")
      .classList.remove("hidden");

    document
      .getElementById("dash")
      .classList.add("hidden");

    return;
  }


  document
    .getElementById("login")
    .classList.add("hidden");

  document
    .getElementById("dash")
    .classList.remove("hidden");


  loadStories();
}


/* =========================
   FILE NAME
========================= */

const imageInput =
  document.getElementById("image");


if (imageInput) {

  imageInput.addEventListener(
    "change",
    function() {

      const fileName =
        document.getElementById("fileName");


      if (this.files.length) {

        fileName.textContent =
          "Selected: " +
          this.files[0].name;

      } else {

        fileName.textContent = "";

      }

    }
  );
}


/* =========================
   IMAGE UPLOAD
========================= */

async function uploadImage(file) {

  if (!file) return null;


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (!allowedTypes.includes(file.type)) {

    throw new Error(
      "Only JPG, PNG and WEBP images are allowed."
    );
  }


  if (file.size > 5 * 1024 * 1024) {

    throw new Error(
      "Image must be 5MB or smaller."
    );
  }


  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const filePath =
    "stories/" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(2) +
    "." +
    extension;


  const { error } =
    await supabaseClient
      .storage
      .from(STORAGE_BUCKET)
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        }
      );


  if (error) throw error;


  const { data } =
    supabaseClient
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);


  return data.publicUrl;
}


/* =========================
   PUBLISH / UPDATE
========================= */

document
  .getElementById("form")
  .addEventListener(
    "submit",
    async function(e) {

      e.preventDefault();


      const title =
        document
          .getElementById("title")
          .value
          .trim();


      const category =
        document
          .getElementById("cat")
          .value;


      const body =
        document
          .getElementById("body")
          .value
          .trim();


      const image =
        document
          .getElementById("image")
          .files[0];


      if (!title || !body) {

        alert(
          "Title aur story likho."
        );

        return;
      }


      const button =
        document.querySelector(
          "#form button[type='submit']"
        );


      button.disabled = true;

      button.textContent =
        editingId
          ? "Updating..."
          : "Publishing...";


      try {

        let imageUrl = null;


        /* Existing image during edit */

        if (editingId) {

          const oldStory =
            await getStory(editingId);

          if (oldStory) {
            imageUrl =
              oldStory.image_url || null;
          }
        }


        /* New image */

        if (image) {

          imageUrl =
            await uploadImage(image);
        }


        const storyData = {
          title: title,
          category: category,
          body: body,
          image_url: imageUrl
        };


        let error;


        if (editingId) {

          const result =
            await supabaseClient
              .from("stories")
              .update(storyData)
              .eq("id", editingId);

          error = result.error;

        } else {

          const result =
            await supabaseClient
              .from("stories")
              .insert(storyData);

          error = result.error;
        }


        if (error) throw error;


        alert(
          editingId
            ? "Story updated successfully! ❤️"
            : "Story published successfully! ❤️"
        );


        resetForm();

        loadStories();


      } catch(error) {

        console.error(error);

        alert(
          "Error: " +
          error.message
        );

      }


      button.disabled = false;

      button.textContent =
        "❤️ Publish Story";

    }
  );


/* =========================
   GET STORY
========================= */

async function getStory(id) {

  const { data, error } =
    await supabaseClient
      .from("stories")
      .select("*")
      .eq("id", id)
      .single();


  if (error) {

    console.error(error);

    return null;
  }


  return data;
}


/* =========================
   LOAD STORIES
========================= */

async function loadStories() {

  const list =
    document.getElementById("list");


  list.innerHTML =
    "<p>Loading stories...</p>";


  const { data, error } =
    await supabaseClient
      .from("stories")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    list.innerHTML =
      "<p>Error: " +
      escapeHTML(error.message) +
      "</p>";

    return;
  }


  if (!data || !data.length) {

    list.innerHTML =
      "<p>No stories yet.</p>";

    return;
  }


  list.innerHTML =
    data.map(function(story) {

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

        <div class="story-admin">

          <div class="story-admin-info">

            ${image}

            <div>

              <b>
                ${escapeHTML(story.title)}
              </b>

              <br>

              <small>
                ${escapeHTML(story.category)}
              </small>

            </div>

          </div>


          <div class="admin-actions">

            <button
              onclick="editStory('${story.id}')">
              ✏️ Edit
            </button>

            <button
              class="delete"
              onclick="deleteStory('${story.id}')">
              🗑️ Delete
            </button>

          </div>

        </div>

      `;

    }).join("");
}


/* =========================
   EDIT
========================= */

async function editStory(id) {

  const story =
    await getStory(id);


  if (!story) return;


  editingId = id;


  document.getElementById(
    "title"
  ).value =
    story.title || "";


  document.getElementById(
    "cat"
  ).value =
    story.category || "Other";


  document.getElementById(
    "body"
  ).value =
    story.body || "";


  document.getElementById(
    "image"
  ).value = "";


  document.getElementById(
    "fileName"
  ).textContent =
    story.image_url
      ? "Existing photo will remain unless you choose a new one."
      : "No existing photo";


  document.querySelector(
    "#form button[type='submit']"
  ).textContent =
    "💾 Update Story";


  document
    .getElementById("form")
    .scrollIntoView({
      behavior: "smooth"
    });
}


/* =========================
   RESET
========================= */

function resetForm() {

  editingId = null;


  document
    .getElementById("form")
    .reset();


  document.getElementById(
    "fileName"
  ).textContent = "";


  document.querySelector(
    "#form button[type='submit']"
  ).textContent =
    "❤️ Publish Story";
}


/* =========================
   DELETE
========================= */

async function deleteStory(id) {

  const confirmed =
    confirm(
      "Delete this story permanently?"
    );


  if (!confirmed) return;


  const { error } =
    await supabaseClient
      .from("stories")
      .delete()
      .eq("id", id);


  if (error) {

    alert(
      "Delete failed: " +
      error.message
    );

    return;
  }


  alert(
    "Story deleted successfully."
  );


  loadStories();
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text) {

  return String(text || "")
    .replace(
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
   START
========================= */

showDashboard();
