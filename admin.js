const SUPABASE_URL = "https://bxgtcnagqjtfbsztgnmb.supabase.co";
const SUPABASE_KEY = "sb_publishable_mQVSdlF4xEsVtW6eFt-vcQ_jQUVVY7G";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const STORAGE_BUCKET = "story-images";

const DEFAULT_PASSWORD = "AKASHRURU";

let editingId = null;


/* =========================
   PASSWORD
========================= */

function getPassword() {
  return localStorage.getItem("arAdminPassword") ||
         DEFAULT_PASSWORD;
}


function login() {

  const password =
    document.getElementById("pass").value;

  if (password === getPassword()) {

    sessionStorage.setItem(
      "arLogin",
      "1"
    );

    showDashboard();

  } else {

    document.getElementById("err").textContent =
      "Wrong password.";
  }
}


function logout() {

  sessionStorage.removeItem("arLogin");

  location.reload();
}


function changePassword() {

  const oldPassword =
    document.getElementById("oldPassword").value;

  const newPassword =
    document.getElementById("newPassword").value;

  const confirmPassword =
    document.getElementById("confirmPassword").value;

  const message =
    document.getElementById("passwordMessage");


  if (oldPassword !== getPassword()) {

    message.textContent =
      "Current password is wrong.";

    return;
  }


  if (newPassword.length < 6) {

    message.textContent =
      "New password must be at least 6 characters.";

    return;
  }


  if (newPassword !== confirmPassword) {

    message.textContent =
      "New passwords do not match.";

    return;
  }


  localStorage.setItem(
    "arAdminPassword",
    newPassword
  );


  message.textContent =
    "Password changed successfully!";


  document.getElementById(
    "oldPassword"
  ).value = "";

  document.getElementById(
    "newPassword"
  ).value = "";

  document.getElementById(
    "confirmPassword"
  ).value = "";
}


/* =========================
   DASHBOARD
========================= */

function showDashboard() {

  document
    .getElementById("login")
    .classList.add("hidden");

  document
    .getElementById("dash")
    .classList.remove("hidden");

  loadStories();
}


/* =========================
   ADMIN TABS
========================= */

function showAdminTab(id, button) {

  document
    .querySelectorAll(".admin-section")
    .forEach(function(section) {

      section.classList.remove("active");

    });


  document
    .querySelectorAll(".admin-tabs button")
    .forEach(function(btn) {

      btn.classList.remove("active");

    });


  document
    .getElementById(id)
    .classList.add("active");


  if (button) {
    button.classList.add("active");
  }
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

  if (!file)
    return null;


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
      "Image size must be 5MB or less."
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


  if (error) {
    throw error;
  }


  const { data } =
    supabaseClient
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);


  return data.publicUrl;
}


/* =========================
   PUBLISH / EDIT STORY
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


      const submitButton =
        document.querySelector(
          "#form button[type='submit']"
        );


      submitButton.disabled = true;

      submitButton.textContent =
        editingId
          ? "Saving..."
          : "Publishing...";


      try {

        let imageUrl = null;


        /*
          EDITING:
          Existing image ko preserve karenge
          agar new image select nahi ki.
        */

        if (editingId) {

          const oldStory =
            await getStory(editingId);

          imageUrl =
            oldStory
              ? oldStory.image_url
              : null;

        }


        /*
          NEW IMAGE
        */

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


        if (error) {
          throw error;
        }


        alert(
          editingId
            ? "Story updated successfully! ❤️"
            : "Story published successfully! ❤️"
        );


        resetForm();

        await loadStories();


      } catch(error) {

        console.error(error);

        alert(
          "Story save nahi hui: " +
          error.message
        );

      }


      submitButton.disabled = false;

      submitButton.textContent =
        "❤️ Publish Story";

    }
  );


/* =========================
   GET ONE STORY
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
          ascending:false
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
   EDIT STORY
========================= */

async function editStory(id) {

  const story =
    await getStory(id);


  if (!story)
    return;


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
      ? "Existing photo will be kept unless you select a new one."
      : "No existing photo";


  const button =
    document.querySelector(
      "#form button[type='submit']"
    );


  button.textContent =
    "💾 Update Story";


  document
    .getElementById("form")
    .scrollIntoView({
      behavior:"smooth"
    });

}


/* =========================
   RESET FORM
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
   DELETE STORY
========================= */

async function deleteStory(id) {

  const story =
    await getStory(id);


  if (!story)
    return;


  const confirmed =
    confirm(
      "Delete this story permanently?"
    );


  if (!confirmed)
    return;


  const { error } =
    await supabaseClient
      .from("stories")
      .delete()
      .eq("id", id);


  if (error) {

    alert(
      "Delete nahi hui: " +
      error.message
    );

    return;
  }


  alert(
    "Story deleted successfully."
  );


  await loadStories();
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
          "&":"&amp;",
          "<":"&lt;",
          ">":"&gt;",
          '"':"&quot;",
          "'":"&#39;"
        }[m];

      }
    );
}


/* =========================
   AUTO LOGIN
========================= */

if (
  sessionStorage.getItem("arLogin") === "1"
) {

  showDashboard();

}
