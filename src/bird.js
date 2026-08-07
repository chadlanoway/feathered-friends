const API_URL =
  "https://7cpncscbj5.execute-api.us-east-1.amazonaws.com";

const IMAGE_BASE_URL =
  "https://d35950nkibzje.cloudfront.net";

const parameters = new URLSearchParams(window.location.search);
const slug = parameters.get("slug");

const loadingElement = document.querySelector("#bird-loading");
const errorElement = document.querySelector("#bird-error");
const profileElement = document.querySelector("#bird-profile");

if (!slug) {
  showError("No bird was selected.");
} else {
  loadBird(slug);
}

async function loadBird(selectedSlug) {
  try {
    const endpoint =
      `${API_URL}/birds/${encodeURIComponent(selectedSlug)}`;

    const response = await fetch(endpoint);

    if (response.status === 404) {
      showError(
        "This bird is no longer available or could not be found."
      );
      return;
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    displayBird(data.bird);
  } catch (error) {
    console.error("Unable to load bird:", error);

    showError(
      "We couldn't load this bird right now. Please try again later."
    );
  }
}

function displayBird(bird) {
  const image = document.querySelector("#bird-image");

  image.src = `${IMAGE_BASE_URL}/${bird.imageKey}`;
  image.alt = `${bird.name}, ${bird.species}`;

  document.querySelector("#bird-name").textContent =
    bird.name;

  document.querySelector("#bird-species").textContent =
    bird.species ?? "";

  document.querySelector("#bird-age").textContent =
    bird.ageText ?? "Not specified";

  document.querySelector("#bird-sex").textContent =
    bird.sex ?? "Not specified";

  document.querySelector("#bird-short-description").textContent =
    bird.shortDescription ?? "";

  document.querySelector("#bird-full-description").textContent =
    bird.fullDescription ?? "";

  const categoryLink =
    document.querySelector("#back-to-category");

  categoryLink.href =
    `./birds.html?category=${encodeURIComponent(bird.category)}`;

  categoryLink.textContent =
    `← View more ${formatCategory(bird.category)}`;

  document.title =
    `${bird.name} | Feathered Friends`;

  loadingElement.hidden = true;
  profileElement.hidden = false;
}

function formatCategory(category) {
  const names = {
    "african-greys": "African Greys",
    amazons: "Amazons",
    cockatiels: "Cockatiels",
    cockatoos: "Cockatoos",
    conures: "Conures",
    macaws: "Macaws",
    parakeets: "Parakeets",
    others: "Other Parrots"
  };

  return names[category] ?? "birds";
}

function showError(message) {
  loadingElement.hidden = true;
  profileElement.hidden = true;
  errorElement.hidden = false;
  errorElement.textContent = message;
}