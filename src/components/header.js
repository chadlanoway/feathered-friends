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
  <a class="nav-donate" href="./index.html#donate">DONATE</a>
</div>
      </nav>
    </header>
  `;

}