const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function videoIdFromUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    let id = "";
    if (hostname === "youtu.be" || hostname === "www.youtu.be") {
      id = url.pathname.split("/")[1];
    } else if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(hostname)) {
      id = url.pathname === "/watch"
        ? url.searchParams.get("v")
        : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : null;
  } catch {
    return null;
  }
}

export function initBlogDashboard({ apiUrl, getAccessToken }) {
  const list = document.querySelector("#blog-post-list");
  const editor = document.querySelector("#blog-editor");
  const blocksContainer = document.querySelector("#blog-blocks");
  const form = document.querySelector("#blog-form");
  const heading = document.querySelector("#blog-editor-heading");
  const message = document.querySelector("#blog-dashboard-message");
  const editorMessage = document.querySelector("#blog-editor-message");
  const draftButton = document.querySelector("#save-blog-draft");
  const publishButton = document.querySelector("#publish-blog-post");
  let currentId = null;
  let blocks = [];
  let busy = false;

  async function request(path, options = {}) {
    const token = await getAccessToken();
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status}).`);
    return data;
  }

  function button(label, action) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = "form-secondary-button";
    element.textContent = label;
    element.addEventListener("click", action);
    return element;
  }

  function renderBlocks() {
    blocksContainer.replaceChildren();
    blocks.forEach((block, index) => {
      const card = document.createElement("div");
      card.className = "blog-editor-block";
      const header = document.createElement("div");
      header.className = "blog-block-header";
      const typeLabel = document.createElement("strong");
      typeLabel.textContent = `${index + 1}. ${block.type === "youtube" ? "YouTube video" : block.type}`;
      const controls = document.createElement("div");
      controls.className = "blog-block-controls";
      const up = button("↑ Move up", () => moveBlock(index, -1));
      up.disabled = index === 0;
      const down = button("↓ Move down", () => moveBlock(index, 1));
      down.disabled = index === blocks.length - 1;
      controls.append(up, down, button("Remove", () => {
        if (block.preview) URL.revokeObjectURL(block.preview);
        blocks.splice(index, 1);
        renderBlocks();
      }));
      header.append(typeLabel, controls);
      card.append(header);

      if (block.type === "text") {
        const label = document.createElement("label");
        label.className = "form-field";
        label.textContent = "Paragraph text";
        const field = document.createElement("textarea");
        field.rows = 6;
        field.maxLength = 10000;
        field.value = block.text || "";
        field.addEventListener("input", () => { block.text = field.value; });
        label.append(field);
        card.append(label);
      } else if (block.type === "image") {
        const label = document.createElement("label");
        label.className = "form-field";
        label.textContent = block.key ? "Replace image (optional)" : "Choose image";
        const field = document.createElement("input");
        field.type = "file";
        field.accept = "image/jpeg,image/png,image/webp";
        field.addEventListener("change", () => {
          const file = field.files?.[0];
          if (!file) return;
          if (!IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_SIZE) {
            editorMessage.textContent = "Choose a JPEG, PNG, or WebP image under 10 MB.";
            field.value = "";
            return;
          }
          if (block.preview) URL.revokeObjectURL(block.preview);
          block.file = file;
          block.preview = URL.createObjectURL(file);
          preview.src = block.preview;
          preview.hidden = false;
          editorMessage.textContent = "";
        });
        label.append(field);
        const altLabel = document.createElement("label");
        altLabel.className = "form-field";
        altLabel.textContent = "Describe this image for visitors *";
        const alt = document.createElement("input");
        alt.maxLength = 200;
        alt.value = block.alt || "";
        alt.addEventListener("input", () => { block.alt = alt.value; });
        altLabel.append(alt);
        const preview = document.createElement("img");
        preview.className = "blog-editor-preview";
        preview.alt = "Selected blog image preview";
        preview.src = block.preview || block.url || "";
        preview.hidden = !preview.src;
        card.append(label, altLabel, preview);
      } else {
        const label = document.createElement("label");
        label.className = "form-field";
        label.textContent = "YouTube link";
        const field = document.createElement("input");
        field.type = "url";
        field.placeholder = "https://www.youtube.com/watch?v=...";
        field.value = block.url || (block.videoId ? `https://www.youtube.com/watch?v=${block.videoId}` : "");
        field.addEventListener("input", () => { block.url = field.value; });
        label.append(field);
        card.append(label);
      }
      blocksContainer.append(card);
    });
  }

  function moveBlock(index, direction) {
    const target = index + direction;
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    renderBlocks();
  }

  function openEditor(post = null) {
    currentId = post?.postId || null;
    blocks.forEach((block) => { if (block.preview) URL.revokeObjectURL(block.preview); });
    blocks = (post?.blocks || []).map((block) => ({ ...block }));
    form.reset();
    form.elements.title.value = post?.title || "";
    heading.textContent = post ? `Edit ${post.title}` : "New post";
    editorMessage.textContent = "";
    editor.hidden = false;
    renderBlocks();
    editor.scrollIntoView({ behavior: "smooth", block: "start" });
    form.elements.title.focus();
  }

  function closeEditor() {
    blocks.forEach((block) => { if (block.preview) URL.revokeObjectURL(block.preview); });
    blocks = [];
    editor.hidden = true;
    currentId = null;
    form.reset();
  }

  function collectBlocks(status) {
    const result = [];
    for (const block of blocks) {
      if (block.type === "text") {
        const text = (block.text || "").trim();
        if (text) result.push({ type: "text", text });
      } else if (block.type === "youtube") {
        if (!block.url && !block.videoId) continue;
        const videoId = videoIdFromUrl(block.url || `https://www.youtube.com/watch?v=${block.videoId}`);
        if (!videoId) throw new Error("Enter a valid YouTube video link.");
        result.push({ type: "youtube", videoId });
      } else if (block.type === "image") {
        if (!block.file && !block.key) continue;
        const alt = (block.alt || "").trim();
        if (!alt) throw new Error("Describe each image before saving.");
        result.push({ type: "image", key: block.key, alt });
      }
    }
    if (status === "published" && result.length === 0) {
      throw new Error("Add some text, an image, or a video before publishing.");
    }
    return result;
  }

  async function save(status) {
    if (busy) return;
    const title = form.elements.title.value.trim();
    if (!title) {
      editorMessage.textContent = "Enter a title.";
      form.elements.title.focus();
      return;
    }
    let serialized;
    try { serialized = collectBlocks(status); }
    catch (error) { editorMessage.textContent = error.message; return; }

    busy = true;
    draftButton.disabled = true;
    publishButton.disabled = true;
    editorMessage.textContent = "Saving post…";
    try {
      if (!currentId) {
        const created = await request("/admin/blog/posts", {
          method: "POST", body: JSON.stringify({ title, blocks: [], status: "draft" })
        });
        currentId = created.post.postId;
      }

      for (const block of blocks) {
        if (!block.file) continue;
        editorMessage.textContent = `Uploading ${block.file.name}…`;
        const upload = await request(
          `/admin/blog/posts/${encodeURIComponent(currentId)}/image-upload-url`,
          { method: "POST", body: JSON.stringify({ contentType: block.file.type }) }
        );
        const uploaded = await fetch(upload.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": block.file.type },
          body: block.file
        });
        if (!uploaded.ok) throw new Error(`Image upload failed (${uploaded.status}).`);
        block.key = upload.key;
        block.url = upload.imageUrl;
        block.file = null;
      }

      serialized = collectBlocks(status);
      await request(`/admin/blog/posts/${encodeURIComponent(currentId)}`, {
        method: "PATCH", body: JSON.stringify({ title, blocks: serialized, status })
      });
      closeEditor();
      await load();
      message.textContent = status === "published" ? "Post published." : "Draft saved.";
    } catch (error) {
      console.error(error);
      editorMessage.textContent = error.message || "Could not save the post.";
    } finally {
      busy = false;
      draftButton.disabled = false;
      publishButton.disabled = false;
    }
  }

  async function load() {
    message.textContent = "Loading posts…";
    try {
      const { posts = [] } = await request("/admin/blog/posts");
      list.replaceChildren();
      if (!posts.length) list.textContent = "No posts yet. Select New post to write one.";
      for (const post of posts) {
        const row = document.createElement("div");
        row.className = "blog-dashboard-row";
        const info = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = post.title;
        const details = document.createElement("span");
        details.textContent = `${post.status === "published" ? "Published" : "Draft"} · Updated ${new Date(post.updatedAt).toLocaleDateString()}`;
        info.append(title, details);
        const actions = document.createElement("div");
        actions.className = "blog-row-actions";
        actions.append(button("Edit", () => openEditor(post)));
        if (post.status === "published") {
          actions.append(button("Unpublish", async () => {
            if (!window.confirm(`Remove “${post.title}” from the home page?`)) return;
            try {
              await request(`/admin/blog/posts/${encodeURIComponent(post.postId)}`, {
                method: "PATCH", body: JSON.stringify({ status: "draft" })
              });
              await load();
              message.textContent = "Post unpublished.";
            } catch (error) { message.textContent = error.message; }
          }));
        }
        row.append(info, actions);
        list.append(row);
      }
      message.textContent = "";
    } catch (error) {
      console.error(error);
      message.textContent = error.message || "Could not load posts.";
    }
  }

  document.querySelector("#new-blog-post").addEventListener("click", () => openEditor());
  document.querySelector("#cancel-blog-edit").addEventListener("click", closeEditor);
  document.querySelectorAll("[data-add-blog-block]").forEach((control) => {
    control.addEventListener("click", () => {
      blocks.push({ type: control.dataset.addBlogBlock });
      renderBlocks();
    });
  });
  draftButton.addEventListener("click", () => save("draft"));
  form.addEventListener("submit", (event) => { event.preventDefault(); save("published"); });

  return { load };
}
