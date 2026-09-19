const API_URL = "https://7cpncscbj5.execute-api.us-east-1.amazonaws.com";

function youtubeFrame(videoId) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId || "")) return null;
  const wrapper = document.createElement("div");
  wrapper.className = "blog-video";
  const frame = document.createElement("iframe");
  frame.src = `https://www.youtube-nocookie.com/embed/${videoId}`;
  frame.title = "YouTube video";
  frame.loading = "lazy";
  frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.allowFullscreen = true;
  wrapper.append(frame);
  return wrapper;
}

function renderPost(post) {
  const article = document.createElement("article");
  article.className = "blog-post";
  const title = document.createElement("h3");
  title.textContent = post.title;
  article.append(title);

  if (post.publishedAt) {
    const date = document.createElement("time");
    date.className = "blog-post-date";
    date.dateTime = post.publishedAt;
    const parsed = new Date(post.publishedAt);
    date.textContent = Number.isNaN(parsed.getTime())
      ? post.publishedAt
      : new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(parsed);
    article.append(date);
  }

  for (const block of post.blocks || []) {
    if (block.type === "text") {
      const paragraph = document.createElement("p");
      paragraph.className = "blog-post-text";
      paragraph.textContent = block.text;
      article.append(paragraph);
    } else if (block.type === "image" && block.url) {
      const image = document.createElement("img");
      image.src = block.url;
      image.alt = block.alt || "";
      image.loading = "lazy";
      article.append(image);
    } else if (block.type === "youtube") {
      const video = youtubeFrame(block.videoId);
      if (video) article.append(video);
    }
  }
  return article;
}

export async function loadBlogPosts() {
  const container = document.querySelector("#blog-posts");
  if (!container) return;

  try {
    const response = await fetch(`${API_URL}/blog/posts`);
    if (!response.ok) throw new Error("Could not load stories.");
    const data = await response.json();
    const posts = Array.isArray(data.posts) ? data.posts : [];
    container.replaceChildren();
    if (!posts.length) {
      const empty = document.createElement("p");
      empty.className = "blog-empty";
      empty.textContent = "Stories are coming soon. Check back with us!";
      container.append(empty);
      return;
    }
    container.append(...posts.map(renderPost));
  } catch (error) {
    console.error(error);
    container.textContent = "Stories are unavailable right now. Please try again later.";
  }
}
