import "./style.css";
import { renderHeader } from "./components/header.js";

renderHeader();
const root = document.documentElement;
const hero = document.querySelector(".hero");

let latestScrollPosition = 0;
let animationFrameRequested = false;

function updateParallax() {
  const heroHeight = hero.offsetHeight;

  // Stop calculating after the hero has left the screen.
  const scrollPosition = Math.min(latestScrollPosition, heroHeight);

  root.style.setProperty(
    "--background-y",
    `${scrollPosition * 0.12}px`
  );

  root.style.setProperty(
    "--birds-y",
    `${scrollPosition * 0.32}px`
  );

  root.style.setProperty(
    "--birds-x",
    `${scrollPosition * -0.06}px`
  );

  root.style.setProperty(
    "--foreground-y",
    `${scrollPosition * 0.48}px`
  );

  root.style.setProperty(
    "--content-y",
    `${scrollPosition * 0.18}px`
  );

  animationFrameRequested = false;
}

function handleScroll() {
  latestScrollPosition = window.scrollY;

  if (!animationFrameRequested) {
    window.requestAnimationFrame(updateParallax);
    animationFrameRequested = true;
  }
}

if (hero) {
  window.addEventListener("scroll", handleScroll, { passive: true });
  updateParallax();
}

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");
const navigationLinks = navigation.querySelectorAll("a");

function openMenu() {
  navigation.classList.add("is-open");
  menuButton.setAttribute("aria-expanded", "true");
  menuButton.setAttribute("aria-label", "Close navigation menu");
}

function closeMenu() {
  navigation.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation menu");
}

function toggleMenu() {
  const isOpen =
    menuButton.getAttribute("aria-expanded") === "true";

  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}

menuButton.addEventListener("click", toggleMenu);

navigationLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    menuButton.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 1050) {
    closeMenu();
  }
});