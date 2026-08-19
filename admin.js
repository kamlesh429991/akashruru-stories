const SUPABASE_URL = "https://bxgtcnagqjtfbsztgnmb.supabase.co";
const SUPABASE_KEY = "sb_publishable_mQVSdlF4xEsVtW6eFt-vcQ_jQUVVY7G";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const PASSWORD = "AKASHRURU";
const BUCKET = "story-images";

async function login() {
  const password = document.getElementById("pass").value;

  if (password === PASSWORD) {
    sessionStorage.arLogin = "1";
    showDashboard();
  } else {
    document.getElementById("err").textContent = "Wrong password.";
  }
}

function showDashboard() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("dash").classList.remove("hidden");
  loadStories();
}

function logout() {
  sessionStorage.removeItem("arLogin");
  location.reload();
}

if (sessionStorage.arLogin === "1") {
  showDashboard();
}

document.getElementById("form").onsubmit = async function(e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("cat").value;
  const body = document.getElementById("body").value.trim();
  const imageFile = document.getElementById("image").files[0];

  let imageUrl = null;

  // Upload photo
  if (imageFile) {

    if (!imageFile.type.startsWith("image/")) {
      alert("Sirf image file upload karo.");
      return;
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      alert("Photo 5 MB se chhoti honi chahiye.");
      return;
    }

    const fileExt = imageFile.name.split(".").pop();

    const fileName =
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2) +
      "." +
      fileExt;

    const { error: uploadError } = await supabaseClient
      .storage
      .from(BUCKET)
      .upload(fileName, imageFile);

    if (uploadError) {
      alert("Photo upload nahi hui: " + uploadError.message);
      return;
    }

    const { data } = supabaseClient
      .storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    imageUrl = data.publicUrl;
  }

  // Save story
  const { error } = await supabaseClient
    .from("stories")
    .insert({
      title: title,
      category: category,
      body: body,
      image_url: imageUrl
    });

  if (error) {
    alert("Story save nahi hui: " + error.message);
    return;
  }

  alert("Story successfully published! ❤️");

  e.target.reset();
  loadStories();
};

async function loadStories() {

  const { data, error } = await supabaseClient
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    document.getElementById("list").innerHTML =
      "<p>Error: " + error.message + "</p>";
    return;
  }

  document.getElementById("list").innerHTML =
    data.map(story => `
      <div class="item">

        ${story.image_url ? `
          <img
            src="${story.image_url}"
            style="
              width:120px;
              height:80px;
              object-fit:cover;
              border-radius:8px;
            "
          >
        ` : ""}

        <div>
          <b>${escapeHTML(story.title)}</b><br>
          <small>${escapeHTML(story.category)}</small>
        </div>

        <button onclick="deleteStory('${story.id}')">
          Delete
        </button>

      </div>
    `).join("") || "<p>No stories yet.</p>";
}

async function deleteStory(id) {

  const { error } = await supabaseClient
    .from("stories")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Delete nahi hui: " + error.message);
    return;
  }

  loadStories();
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}
