const API_URL =
  "https://7cpncscbj5.execute-api.us-east-1.amazonaws.com";

const IMAGE_BASE_URL =
  "https://d35950nkibzje.cloudfront.net";

const categoryNames = {
  "african-greys": "African Greys",
  amazons: "Amazons",
  cockatiels: "Cockatiels",
  cockatoos: "Cockatoos",
  conures: "Conures",
  macaws: "Macaws",
  parakeets: "Parakeets",
  others: "Other Parrots"
};

const parameters = new URLSearchParams(window.location.search);
const category = parameters.get("category")?.toLowerCase();

const titleElement = document.querySelector("#category-title");
const loadingElement = document.querySelector("#birds-loading");
const errorElement = document.querySelector("#birds-error");
const gridElement = document.querySelector("#birds-grid");

if (!category || !categoryNames[category]) {
  showError("That bird category could not be found.");
} else {
  titleElement.textContent = categoryNames[category];
  document.title =
    `${categoryNames[category]} | Feathered Friends`;

  loadBirds(category);
}

async function loadBirds(selectedCategory) {
  try {
    const endpoint =
      `${API_URL}/birds?category=${encodeURIComponent(selectedCategory)}`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    loadingElement.hidden = true;

    if (!data.birds || data.birds.length === 0) {
      showEmptyMessage();
      return;
    }

    data.birds.forEach(createBirdCard);
  } catch (error) {
    console.error("Unable to load birds:", error);

    showError(
      "We couldn't load the birds right now. Please try again later."
    );
  }
}

function createBirdCard(bird) {
  const card = document.createElement("a");
  card.className = "bird-card";
  card.href =
    `./bird.html?slug=${encodeURIComponent(bird.slug)}`;

  const imageArea = document.createElement("div");
  imageArea.className = "bird-card-image";

  const image = document.createElement("img");

  image.src = `${IMAGE_BASE_URL}/${bird.thumbnailKey}`;
  image.alt = `${bird.name}, ${bird.species}`;
  image.loading = "lazy";

  imageArea.append(image);

  const content = document.createElement("div");
  content.className = "bird-card-content";

  const name = document.createElement("h2");
  name.textContent = bird.name;

  const species = document.createElement("p");
  species.className = "bird-species";
  species.textContent = bird.species ?? "";

  const facts = document.createElement("p");
  facts.className = "bird-facts";

  facts.textContent = [bird.ageText, bird.sex]
    .filter(Boolean)
    .join(" • ");

  const description = document.createElement("p");
  description.className = "bird-description";
  description.textContent = bird.shortDescription ?? "";

  const linkText = document.createElement("span");
  linkText.className = "bird-card-link";
  linkText.textContent = `Meet ${bird.name} →`;

  content.append(
    name,
    species,
    facts,
    description,
    linkText
  );

  card.append(imageArea, content);
  gridElement.append(card);
}

function showEmptyMessage() {
  loadingElement.hidden = true;

  const message = document.createElement("div");
  message.className = "birds-message birds-empty";
  message.textContent =
    `There are currently no ${categoryNames[category]} available for adoption.`;

  gridElement.append(message);
}

function showError(message) {
  loadingElement.hidden = true;
  errorElement.hidden = false;
  errorElement.textContent = message;
}