const gallery = document.querySelector("#volunteer-gallery");

if (gallery) {
  const imageModules = import.meta.glob(
    "./assets/volunteers/*.{avif,gif,jpeg,jpg,png,webp}",
    {
      eager: true,
      query: "?url",
      import: "default",
      caseSensitive: false,
    }
  );

  const images = Object.entries(imageModules).sort(
    ([firstPath], [secondPath]) =>
      firstPath.localeCompare(
        secondPath,
        undefined,
        { numeric: true }
      )
  );

  if (images.length === 0) {
    const message = document.createElement("p");
    message.className = "gallery-empty";
    message.textContent =
      "Volunteer photographs will be added soon.";

    gallery.append(message);
  } else {
    images.forEach(([, imageUrl], index) => {
      const figure = document.createElement("figure");
      figure.className = "volunteer-photo";

      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt =
        `Feathered Friends volunteers, photo ${index + 1}`;
      image.loading = index < 2 ? "eager" : "lazy";
      image.decoding = "async";

      figure.append(image);
      gallery.append(figure);
    });
  }

  const previousButton = document.querySelector(
    ".gallery-arrow--previous"
  );

  const nextButton = document.querySelector(
    ".gallery-arrow--next"
  );

  function scrollGallery(direction) {
    gallery.scrollBy({
      left: gallery.clientWidth * 0.8 * direction,
      behavior: "smooth",
    });
  }

  function updateArrowStates() {
    const maximumScroll =
      gallery.scrollWidth - gallery.clientWidth;

    previousButton.disabled = gallery.scrollLeft <= 2;

    nextButton.disabled =
      gallery.scrollLeft >= maximumScroll - 2;
  }

  previousButton?.addEventListener("click", () => {
    scrollGallery(-1);
  });

  nextButton?.addEventListener("click", () => {
    scrollGallery(1);
  });

  gallery.addEventListener("scroll", updateArrowStates, {
    passive: true,
  });

  window.addEventListener("resize", updateArrowStates);

  updateArrowStates();
}