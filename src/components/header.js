export function renderHeader() {
  const headerContainer = document.querySelector("#site-header");

  if (!headerContainer) {
    return;
  }

  headerContainer.innerHTML = `
    <header class="site-header">
    

      <nav class="navbar" aria-label="Main navigation">
      
        <a class="site-logo" href="./index.html">
          <span class="logo-name">Feathered Friends</span>
          <span class="logo-tagline">
            Sanctuary &amp; Rescue, Inc
          </span>
        </a>

        <button
          class="menu-toggle"
          type="button"
          aria-label="Open navigation menu"
          aria-expanded="false"
          aria-controls="main-navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div class="nav-links" id="main-navigation">
  <a href="./index.html">Home</a>
  <a href="about.html">About</a>
  <a href="adoption.html">Adoption</a>
  <a href="volunteer.html">Volunteer</a>
  <a href="boarding.html">Boarding</a>
  <a href="./surrender.html">Surrender</a>
  <a href="contact.html">Contact</a>
  <a href="faq.html">FAQ</a>
  <a href="donate.html">Donate</a>
</div>
      </nav>
    </header>
  `;
  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

  const pageGroups = {
    "birds.html": "adoption.html",
    "bird.html": "adoption.html",
    "adoption-form.html": "adoption.html",
    "volunteer-form.html": "volunteer.html",
    "boarding-form.html": "boarding.html"
  };

  const activePage = pageGroups[currentPage] || currentPage;

  headerContainer.querySelectorAll(".nav-links a").forEach((link) => {
    const linkUrl = new URL(link.href, window.location.href);
    const linkPage =
      linkUrl.pathname.split("/").pop() || "index.html";

    if (
      linkPage === activePage &&
      !linkUrl.hash
    ) {
      link.classList.add("nav-donate");
      link.setAttribute("aria-current", "page");
    }
  });
} 