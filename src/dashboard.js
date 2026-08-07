import "./style.css";

import { Amplify } from "aws-amplify";

import {
  signIn,
  confirmSignIn,
  signOut,
  getCurrentUser,
  fetchAuthSession
} from "aws-amplify/auth";

const API_URL =
  "https://7cpncscbj5.execute-api.us-east-1.amazonaws.com";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_8zokYXeQv",
      userPoolClientId: "4rd2macl2r3oqmd63fs23u7c1e",
      loginWith: {
        email: true
      }
    }
  }
});

const loginPanel = document.querySelector("#login-panel");
const newPasswordPanel =
  document.querySelector("#new-password-panel");
const dashboardPanel =
  document.querySelector("#dashboard-panel");

const loginForm = document.querySelector("#login-form");
const newPasswordForm =
  document.querySelector("#new-password-form");

const loginMessage =
  document.querySelector("#login-message");
const passwordMessage =
  document.querySelector("#password-message");
const dashboardMessage =
  document.querySelector("#dashboard-message");

const birdsBody =
  document.querySelector("#dashboard-birds");

const signOutButton =
  document.querySelector("#sign-out-button");

const dashboardNavigation =
  document.querySelector("#dashboard-navigation");

const dashboardMenuToggle =
  document.querySelector("#dashboard-menu-toggle");

const dashboardNavigationLinks =
  document.querySelectorAll(".dashboard-nav-link");

const dashboardSections =
  document.querySelectorAll("[data-dashboard-panel]");

const surrenderMessage =
  document.querySelector("#surrender-dashboard-message");

const surrenderTableWrapper =
  document.querySelector("#surrender-table-wrapper");

const surrendersBody =
  document.querySelector("#dashboard-surrenders");

const surrenderFilterButtons =
  document.querySelectorAll("[data-surrender-view]");

const surrenderDetailPanel =
  document.querySelector("#surrender-detail-panel");

const surrenderDetailTitle =
  document.querySelector("#surrender-detail-title");

const surrenderDetailId =
  document.querySelector("#surrender-detail-id");

const surrenderDetailContent =
  document.querySelector("#surrender-detail-content");

const closeSurrenderDetailButton =
  document.querySelector("#close-surrender-detail");

const adoptionMessage =
  document.querySelector("#adoption-dashboard-message");

const adoptionTableWrapper =
  document.querySelector("#adoption-table-wrapper");

const adoptionsBody =
  document.querySelector("#dashboard-adoptions");

const adoptionFilterButtons =
  document.querySelectorAll("[data-adoption-view]");

const adoptionDetailPanel =
  document.querySelector("#adoption-detail-panel");

const adoptionDetailTitle =
  document.querySelector("#adoption-detail-title");

const adoptionDetailId =
  document.querySelector("#adoption-detail-id");

const adoptionDetailContent =
  document.querySelector("#adoption-detail-content");

const closeAdoptionDetailButton =
  document.querySelector("#close-adoption-detail");

let currentSurrenderView = "unreviewed";
let currentAdoptionView = "unreviewed";
loginForm.addEventListener("submit", handleLogin);
newPasswordForm.addEventListener(
  "submit",
  handleNewPassword
);

const addBirdButton =
  document.querySelector("#add-bird-button");

const birdFormPanel =
  document.querySelector("#bird-form-panel");

const createBirdForm =
  document.querySelector("#create-bird-form");

const cancelBirdButton =
  document.querySelector("#cancel-bird-button");

const saveBirdButton =
  document.querySelector("#save-bird-button");

const birdFormMessage =
  document.querySelector("#bird-form-message");

addBirdButton.addEventListener(
  "click",
  openBirdForm
);

cancelBirdButton.addEventListener(
  "click",
  closeBirdForm
);

createBirdForm.addEventListener(
  "submit",
  handleCreateBird
);

signOutButton.addEventListener("click", handleSignOut);

checkExistingSession();

dashboardMenuToggle.addEventListener(
  "click",
  toggleDashboardMenu
);

dashboardNavigationLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    const sectionName =
      link.dataset.dashboardSection;

    showDashboardSection(sectionName);
    closeDashboardMenu();

    if (sectionName === "surrenders") {
      loadSurrenders(currentSurrenderView);
    }

    if (sectionName === "adoptions") {
      loadAdoptions(currentAdoptionView);
    }
  });
});

surrenderFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    loadSurrenders(button.dataset.surrenderView);
  });
});

closeSurrenderDetailButton.addEventListener(
  "click",
  closeSurrenderDetail
);

adoptionFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    loadAdoptions(button.dataset.adoptionView);
  });
});

closeAdoptionDetailButton.addEventListener(
  "click",
  closeAdoptionDetail
);

async function checkExistingSession() {
  try {
    await getCurrentUser();
    await showDashboard();
  } catch {
    showLogin();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  loginMessage.textContent = "Signing in...";

  const username =
    document.querySelector("#login-email").value.trim();

  const password =
    document.querySelector("#login-password").value;

  try {
    const result = await signIn({
      username,
      password
    });

    if (result.isSignedIn) {
      await showDashboard();
      return;
    }

    if (
      result.nextStep.signInStep ===
      "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
    ) {
      loginPanel.hidden = true;
      newPasswordPanel.hidden = false;
      loginMessage.textContent = "";
      return;
    }

    throw new Error(
      `Additional sign-in step required: ${result.nextStep.signInStep
      }`
    );
  } catch (error) {
    console.error(error);
    loginMessage.textContent =
      error.message || "Unable to sign in.";
  }
}

async function handleNewPassword(event) {
  event.preventDefault();
  passwordMessage.textContent = "Saving password...";

  const newPassword =
    document.querySelector("#new-password").value;

  try {
    const result = await confirmSignIn({
      challengeResponse: newPassword
    });

    if (!result.isSignedIn) {
      throw new Error(
        `Additional sign-in step required: ${result.nextStep.signInStep
        }`
      );
    }

    await showDashboard();
  } catch (error) {
    console.error(error);
    passwordMessage.textContent =
      error.message || "Unable to save password.";
  }
}

async function showDashboard() {
  loginPanel.hidden = true;
  newPasswordPanel.hidden = true;
  dashboardPanel.hidden = false;

  dashboardMessage.textContent = "Loading birds...";

  try {
    const session = await fetchAuthSession();
    const accessToken =
      session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new Error("No Cognito access token was returned.");
    }

    const response = await fetch(
      `${API_URL}/admin/birds`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Dashboard API returned ${response.status}`
      );
    }

    const data = await response.json();

    renderBirds(data.birds ?? []);

    dashboardMessage.textContent =
      `${data.count ?? 0} bird(s) found.`;
  } catch (error) {
    console.error(error);
    dashboardMessage.textContent =
      error.message || "Unable to load birds.";
  }
}

function renderBirds(birds) {
  birdsBody.replaceChildren();

  birds.forEach((bird) => {
    const row = document.createElement("tr");

    row.append(
      createCell(bird.birdName),
      createCell(bird.category),
      createCell(bird.species),
      createVisibilityCell(bird)
    );

    birdsBody.append(row);
  });
}

function createVisibilityCell(bird) {
  const cell = document.createElement("td");
  const button = document.createElement("button");

  const isPublished =
    bird.publishStatus === "available";

  button.type = "button";

  button.className = isPublished
    ? "visibility-toggle visibility-toggle--published"
    : "visibility-toggle visibility-toggle--unpublished";

  button.textContent = isPublished
    ? "Published"
    : "Unpublished";

  button.setAttribute(
    "aria-pressed",
    String(isPublished)
  );

  button.title = isPublished
    ? `Click to unpublish ${bird.birdName}`
    : `Click to publish ${bird.birdName}`;

  button.addEventListener("click", async () => {
    await changePublishStatus(bird, button);
  });

  cell.append(button);

  return cell;
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value ?? "";
  return cell;
}

async function getDashboardAccessToken() {
  const session = await fetchAuthSession();
  const accessToken = session.tokens?.accessToken?.toString();

  if (!accessToken) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return accessToken;
}

async function loadSurrenders(view = "unreviewed") {
  currentSurrenderView = view;
  closeSurrenderDetail();

  surrenderFilterButtons.forEach((button) => {
    const isActive = button.dataset.surrenderView === view;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.disabled = true;
  });

  surrenderMessage.textContent = "Loading surrender requests...";
  surrenderTableWrapper.hidden = true;
  surrendersBody.replaceChildren();

  try {
    const accessToken = await getDashboardAccessToken();
    const parameters = new URLSearchParams({
      formType: "surrender",
      view,
      limit: "100"
    });

    const response = await fetch(
      `${API_URL}/admin/submissions?${parameters}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message ||
        `Submissions API returned ${response.status}`
      );
    }

    const submissions = result.submissions ?? [];
    renderSurrenders(submissions);

    surrenderMessage.textContent = submissions.length === 0
      ? view === "unreviewed"
        ? "There are no unreviewed surrender requests."
        : "There are no surrender requests."
      : `${submissions.length} surrender request(s) found.`;

    surrenderTableWrapper.hidden = submissions.length === 0;
  } catch (error) {
    console.error(error);
    surrenderMessage.textContent =
      error.message || "Unable to load surrender requests.";
  } finally {
    surrenderFilterButtons.forEach((button) => {
      button.disabled = false;
    });
  }
}

function renderSurrenders(submissions) {
  surrendersBody.replaceChildren();

  submissions.forEach((submission) => {
    const row = document.createElement("tr");
    const actionCell = document.createElement("td");
    const actionGroup = document.createElement("div");
    const viewButton = document.createElement("button");
    const downloadButton = document.createElement("button");

    viewButton.type = "button";
    viewButton.className = "submission-action-button submission-action-button--view";
    viewButton.textContent = "View";
    viewButton.addEventListener("click", () => {
      loadSurrenderDetail(submission.submissionId);
    });

    downloadButton.type = "button";
    downloadButton.className = "submission-action-button submission-action-button--download";
    downloadButton.textContent = "Download";
    downloadButton.addEventListener("click", () => {
      downloadSubmission(submission.submissionId, downloadButton);
    });

    actionGroup.className = "submission-row-actions";
    actionGroup.append(viewButton, downloadButton);
    actionCell.append(actionGroup);

    row.append(
      createCell(formatSubmissionDate(submission.submittedAt)),
      createCell(submission.applicantName),
      createCell(submission.birdName),
      createCell(submission.birdSpecies),
      createStatusCell(submission.reviewStatus),
      createDecisionCell(submission),
      actionCell
    );

    surrendersBody.append(row);
  });
}

async function loadAdoptions(view = "unreviewed") {
  currentAdoptionView = view;
  closeAdoptionDetail();

  adoptionFilterButtons.forEach((button) => {
    const isActive = button.dataset.adoptionView === view;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.disabled = true;
  });

  adoptionMessage.textContent = "Loading adoption applications...";
  adoptionTableWrapper.hidden = true;
  adoptionsBody.replaceChildren();

  try {
    const accessToken = await getDashboardAccessToken();
    const parameters = new URLSearchParams({
      formType: "adoption",
      view,
      limit: "100"
    });

    const response = await fetch(
      `${API_URL}/admin/submissions?${parameters}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message ||
        `Submissions API returned ${response.status}`
      );
    }

    const submissions = result.submissions ?? [];
    renderAdoptions(submissions);

    adoptionMessage.textContent = submissions.length === 0
      ? view === "unreviewed"
        ? "There are no unreviewed adoption applications."
        : "There are no adoption applications."
      : `${submissions.length} adoption application(s) found.`;

    adoptionTableWrapper.hidden = submissions.length === 0;
  } catch (error) {
    console.error(error);
    adoptionMessage.textContent =
      error.message || "Unable to load adoption applications.";
  } finally {
    adoptionFilterButtons.forEach((button) => {
      button.disabled = false;
    });
  }
}

function renderAdoptions(submissions) {
  adoptionsBody.replaceChildren();

  submissions.forEach((submission) => {
    const row = document.createElement("tr");
    const actionCell = document.createElement("td");
    const actionGroup = document.createElement("div");
    const viewButton = document.createElement("button");
    const downloadButton = document.createElement("button");

    viewButton.type = "button";
    viewButton.className = "submission-action-button submission-action-button--view";
    viewButton.textContent = "View";
    viewButton.addEventListener("click", () => {
      loadAdoptionDetail(submission.submissionId);
    });

    downloadButton.type = "button";
    downloadButton.className = "submission-action-button submission-action-button--download";
    downloadButton.textContent = "Download";
    downloadButton.addEventListener("click", () => {
      downloadAdoptionSubmission(submission.submissionId, downloadButton);
    });

    actionGroup.className = "submission-row-actions";
    actionGroup.append(viewButton, downloadButton);
    actionCell.append(actionGroup);

    row.append(
      createCell(formatSubmissionDate(submission.submittedAt)),
      createCell(submission.applicantName),
      createCell(submission.birdName || "Undecided"),
      createCell(submission.applicantEmail),
      createStatusCell(submission.reviewStatus),
      createAdoptionDecisionCell(submission),
      actionCell
    );

    adoptionsBody.append(row);
  });
}

function createAdoptionDecisionCell(submission) {
  const cell = document.createElement("td");
  const select = document.createElement("select");

  select.className = "submission-decision-select";
  select.setAttribute(
    "aria-label",
    `Decision for ${submission.applicantName || "adoption application"}`
  );

  [
    ["", "Choose..."],
    ["accepted", "Accepted"],
    ["rejected", "Rejected"]
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  });

  select.value = ["accepted", "rejected"].includes(submission.decision)
    ? submission.decision
    : "";

  select.dataset.previousValue = select.value;
  select.classList.toggle("is-accepted", select.value === "accepted");
  select.classList.toggle("is-rejected", select.value === "rejected");

  select.addEventListener("change", () => {
    if (select.value) {
      changeAdoptionDecision(submission, select);
    }
  });

  cell.append(select);
  return cell;
}

async function changeAdoptionDecision(submission, select) {
  const decision = select.value;
  const previousValue = select.dataset.previousValue || "";
  const confirmed = window.confirm(
    `Mark the adoption application from ${submission.applicantName || "this applicant"} as ${decision}? ` +
    "This will also mark the application as reviewed."
  );

  if (!confirmed) {
    select.value = previousValue;
    return;
  }

  select.disabled = true;
  adoptionMessage.textContent = `Saving ${decision} decision...`;

  try {
    const accessToken = await getDashboardAccessToken();
    const response = await fetch(
      `${API_URL}/admin/submissions/${encodeURIComponent(submission.submissionId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ decision })
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message ||
        `Submissions API returned ${response.status}`
      );
    }

    await loadAdoptions(currentAdoptionView);
    adoptionMessage.textContent = result.message;
  } catch (error) {
    console.error(error);
    select.value = previousValue;
    select.disabled = false;
    adoptionMessage.textContent =
      error.message || "Unable to save the decision.";
  }
}

function createDecisionCell(submission) {
  const cell = document.createElement("td");
  const select = document.createElement("select");

  select.className = "submission-decision-select";
  select.setAttribute(
    "aria-label",
    `Decision for ${submission.birdName || "submission"}`
  );

  [
    ["", "Choose..."],
    ["accepted", "Accepted"],
    ["rejected", "Rejected"]
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  });

  select.value = ["accepted", "rejected"].includes(submission.decision)
    ? submission.decision
    : "";

  select.dataset.previousValue = select.value;
  select.classList.toggle(
    "is-accepted",
    select.value === "accepted"
  );
  select.classList.toggle(
    "is-rejected",
    select.value === "rejected"
  );

  select.addEventListener("change", () => {
    if (select.value) {
      changeSubmissionDecision(submission, select);
    }
  });

  cell.append(select);
  return cell;
}

async function changeSubmissionDecision(submission, select) {
  const decision = select.value;
  const previousValue = select.dataset.previousValue || "";
  const confirmed = window.confirm(
    `Mark the surrender request for ${submission.birdName || "this bird"} as ${decision}? ` +
    "This will also mark the request as reviewed."
  );

  if (!confirmed) {
    select.value = previousValue;
    return;
  }

  select.disabled = true;
  surrenderMessage.textContent = `Saving ${decision} decision...`;

  try {
    const accessToken = await getDashboardAccessToken();
    const response = await fetch(
      `${API_URL}/admin/submissions/${encodeURIComponent(submission.submissionId)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ decision })
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message ||
        `Submissions API returned ${response.status}`
      );
    }

    await loadSurrenders(currentSurrenderView);
    surrenderMessage.textContent = result.message;
  } catch (error) {
    console.error(error);
    select.value = previousValue;
    select.disabled = false;
    surrenderMessage.textContent =
      error.message || "Unable to save the decision.";
  }
}

function createStatusCell(status) {
  const cell = document.createElement("td");
  const badge = document.createElement("span");
  const normalizedStatus = status || "unknown";

  badge.className =
    `submission-status submission-status--${normalizedStatus}`;
  badge.textContent = formatAnswer(normalizedStatus);
  cell.append(badge);

  return cell;
}

function formatSubmissionDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

async function loadSurrenderDetail(submissionId) {
  surrenderDetailPanel.hidden = false;
  surrenderDetailTitle.textContent = "Loading submission...";
  surrenderDetailId.textContent = submissionId;
  surrenderDetailContent.replaceChildren();

  surrenderDetailPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  try {
    const submission = await fetchSubmission(submissionId);
    renderSurrenderDetail(submission);
  } catch (error) {
    console.error(error);
    surrenderDetailTitle.textContent = "Unable to load submission";

    const message = document.createElement("p");
    message.className = "submission-detail-error";
    message.textContent =
      error.message || "Unable to load this surrender request.";
    surrenderDetailContent.append(message);
  }
}

async function fetchSubmission(submissionId) {
  const accessToken = await getDashboardAccessToken();
  const response = await fetch(
    `${API_URL}/admin/submissions/${encodeURIComponent(submissionId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message ||
      `Submission API returned ${response.status}`
    );
  }

  return result.submission;
}

async function downloadSubmission(submissionId, button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Preparing...";

  try {
    const submission = await fetchSubmission(submissionId);
    const fileContent = formatSubmissionDownload(submission);
    const blob = new Blob([fileContent], {
      type: "text/plain;charset=utf-8"
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeBirdName = (submission.birdName || "surrender")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    link.href = downloadUrl;
    link.download = `${safeBirdName || "surrender"}-${submission.submissionId}.txt`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error(error);
    surrenderMessage.textContent =
      error.message || "Unable to download the submission.";
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function formatSubmissionDownload(submission) {
  const lines = [
    "FEATHERED FRIENDS SANCTUARY & RESCUE, INC.",
    "SURRENDER REQUEST",
    "",
    `Submission ID: ${submission.submissionId}`,
    `Submitted: ${formatSubmissionDate(submission.submittedAt)}`,
    `Review status: ${formatAnswer(submission.reviewStatus)}`,
    `Decision: ${formatAnswer(submission.decision)}`,
    ""
  ];

  const sections = [
    ["CONTACT INFORMATION", submission.contact],
    ["PARROT IDENTIFICATION", submission.identification],
    ["HEALTH INFORMATION", submission.health],
    ["DIET", submission.diet],
    ["TEMPERAMENT AND BEHAVIOR", submission.behavior],
    ["BELONGINGS", submission.belongings],
    ["SURRENDER INFORMATION", submission.surrenderDetails],
    ["ACKNOWLEDGEMENT", submission.agreement]
  ];

  sections.forEach(([title, values]) => {
    if (!values || Object.keys(values).length === 0) {
      return;
    }

    lines.push(title, "-".repeat(title.length));

    Object.entries(values).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        lines.push(`${friendlyFieldName(key)}: ${formatAnswer(value)}`);
      }
    });

    lines.push("");
  });

  return lines.join("\r\n");
}

async function loadAdoptionDetail(submissionId) {
  adoptionDetailPanel.hidden = false;
  adoptionDetailTitle.textContent = "Loading application...";
  adoptionDetailId.textContent = submissionId;
  adoptionDetailContent.replaceChildren();

  adoptionDetailPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  try {
    const submission = await fetchSubmission(submissionId);
    renderAdoptionDetail(submission);
  } catch (error) {
    console.error(error);
    adoptionDetailTitle.textContent = "Unable to load application";

    const message = document.createElement("p");
    message.className = "submission-detail-error";
    message.textContent =
      error.message || "Unable to load this adoption application.";
    adoptionDetailContent.append(message);
  }
}

async function downloadAdoptionSubmission(submissionId, button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Preparing...";

  try {
    const submission = await fetchSubmission(submissionId);
    const fileContent = formatAdoptionDownload(submission);
    const blob = new Blob([fileContent], {
      type: "text/plain;charset=utf-8"
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeApplicantName = (submission.applicantName || "adoption-application")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    link.href = downloadUrl;
    link.download = `${safeApplicantName || "adoption-application"}-${submission.submissionId}.txt`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error(error);
    adoptionMessage.textContent =
      error.message || "Unable to download the application.";
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function formatAdoptionDownload(submission) {
  const lines = [
    "FEATHERED FRIENDS SANCTUARY & RESCUE, INC.",
    "ADOPTION APPLICATION",
    "",
    `Submission ID: ${submission.submissionId}`,
    `Submitted: ${formatSubmissionDate(submission.submittedAt)}`,
    `Review status: ${formatAnswer(submission.reviewStatus)}`,
    `Decision: ${formatAnswer(submission.decision)}`,
    ""
  ];

  const sections = [
    ["CONTACT INFORMATION", submission.contact],
    ["APPLICANT INFORMATION", submission.applicant],
    ["RESIDENCE", submission.residence],
    ["HOUSEHOLD", submission.household],
    ["PETS AND VETERINARY CARE", submission.pets],
    ["ADOPTION INTEREST", submission.adoptionInterest],
    ["LONG-TERM COMMITMENT", submission.commitment],
    ["PARROT CARE KNOWLEDGE", submission.careKnowledge],
    ["INTERACTION AND BEHAVIOR", submission.interaction],
    ["PERSONAL REFERENCE", submission.reference],
    ["AGREEMENT", submission.agreement]
  ];

  sections.forEach(([title, values]) => {
    if (!values || Object.keys(values).length === 0) {
      return;
    }

    lines.push(title, "-".repeat(title.length));

    Object.entries(values).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        lines.push(`${friendlyFieldName(key)}: ${formatAnswer(value)}`);
      }
    });

    lines.push("");
  });

  return lines.join("\r\n");
}

function renderSurrenderDetail(submission) {
  surrenderDetailTitle.textContent =
    `${submission.birdName || "Unnamed bird"} - ${submission.applicantName || "Unknown applicant"}`;
  surrenderDetailId.textContent = submission.submissionId;
  surrenderDetailContent.replaceChildren();

  const summary = {
    submittedAt: formatSubmissionDate(submission.submittedAt),
    reviewStatus: submission.reviewStatus,
    decision: submission.decision,
    applicantName: submission.applicantName,
    applicantEmail: submission.applicantEmail,
    birdName: submission.birdName,
    birdSpecies: submission.birdSpecies
  };

  const sections = [
    ["Submission summary", summary],
    ["Contact information", submission.contact],
    ["Parrot identification", submission.identification],
    ["Health information", submission.health],
    ["Diet", submission.diet],
    ["Temperament and behavior", submission.behavior],
    ["Belongings", submission.belongings],
    ["Surrender information", submission.surrenderDetails],
    ["Acknowledgement", submission.agreement]
  ];

  sections.forEach(([title, values]) => {
    if (values && Object.keys(values).length > 0) {
      surrenderDetailContent.append(
        createSubmissionDetailSection(title, values)
      );
    }
  });
}

function renderAdoptionDetail(submission) {
  adoptionDetailTitle.textContent =
    `${submission.applicantName || "Unknown applicant"} - ` +
    `${submission.birdName || "Undecided bird"}`;
  adoptionDetailId.textContent = submission.submissionId;
  adoptionDetailContent.replaceChildren();

  const summary = {
    submittedAt: formatSubmissionDate(submission.submittedAt),
    reviewStatus: submission.reviewStatus,
    decision: submission.decision,
    applicantName: submission.applicantName,
    applicantEmail: submission.applicantEmail,
    birdName: submission.birdName
  };

  const sections = [
    ["Application summary", summary],
    ["Contact information", submission.contact],
    ["Applicant information", submission.applicant],
    ["Residence", submission.residence],
    ["Household", submission.household],
    ["Pets and veterinary care", submission.pets],
    ["Adoption interest", submission.adoptionInterest],
    ["Long-term commitment", submission.commitment],
    ["Parrot care knowledge", submission.careKnowledge],
    ["Interaction and behavior", submission.interaction],
    ["Personal reference", submission.reference],
    ["Agreement", submission.agreement]
  ];

  sections.forEach(([title, values]) => {
    if (values && Object.keys(values).length > 0) {
      adoptionDetailContent.append(
        createSubmissionDetailSection(title, values)
      );
    }
  });
}

function createSubmissionDetailSection(title, values) {
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  const list = document.createElement("dl");

  section.className = "submission-detail-section";
  heading.textContent = title;
  section.append(heading);

  Object.entries(values).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) {
      return;
    }

    const term = document.createElement("dt");
    const description = document.createElement("dd");

    term.textContent = friendlyFieldName(key);
    description.textContent = formatAnswer(value);
    list.append(term, description);
  });

  section.append(list);
  return section;
}

function friendlyFieldName(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatAnswer(value) {
  if (value === true || value === "yes") {
    return "Yes";
  }

  if (value === false || value === "no") {
    return "No";
  }

  if (value === "unknown") {
    return "Unknown";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function closeSurrenderDetail() {
  surrenderDetailPanel.hidden = true;
  surrenderDetailTitle.textContent = "Submission details";
  surrenderDetailId.textContent = "";
  surrenderDetailContent.replaceChildren();
}

function closeAdoptionDetail() {
  adoptionDetailPanel.hidden = true;
  adoptionDetailTitle.textContent = "Application details";
  adoptionDetailId.textContent = "";
  adoptionDetailContent.replaceChildren();
}

async function changePublishStatus(bird, button) {
  const isPublished =
    bird.publishStatus === "available";

  const nextStatus = isPublished
    ? "draft"
    : "available";

  const actionLabel = isPublished
    ? "unpublish"
    : "publish";

  const confirmed = window.confirm(
    `Are you sure you want to ${actionLabel} ${bird.birdName}?`
  );

  if (!confirmed) {
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";
  dashboardMessage.textContent =
    `Updating ${bird.birdName}...`;

  try {
    const session = await fetchAuthSession();

    const accessToken =
      session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new Error("Your session has expired.");
    }

    const response = await fetch(
      `${API_URL}/admin/birds/${encodeURIComponent(
        bird.birdId
      )}`,
      {
        method: "PATCH",

        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          publishStatus: nextStatus
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ??
        `Dashboard API returned ${response.status}`
      );
    }

    dashboardMessage.textContent = result.message;

    await showDashboard();
  } catch (error) {
    console.error(error);

    dashboardMessage.textContent =
      error.message || "Unable to update the bird.";

    button.disabled = false;
    button.textContent = isPublished
      ? "Published"
      : "Unpublished";
  }
}

async function handleSignOut() {
  await signOut();
  birdsBody.replaceChildren();
  showLogin();
}

function showLogin() {
  loginPanel.hidden = false;
  newPasswordPanel.hidden = true;
  dashboardPanel.hidden = true;

  loginMessage.textContent = "";
  passwordMessage.textContent = "";
  closeDashboardMenu();
}

function showDashboardSection(sectionName) {
  dashboardSections.forEach((section) => {
    section.hidden =
      section.dataset.dashboardPanel !== sectionName;
  });

  dashboardNavigationLinks.forEach((link) => {
    const isActive =
      link.dataset.dashboardSection === sectionName;

    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function toggleDashboardMenu() {
  const isOpen =
    dashboardMenuToggle.getAttribute("aria-expanded") ===
    "true";

  if (isOpen) {
    closeDashboardMenu();
  } else {
    dashboardNavigation.classList.add("is-open");
    dashboardMenuToggle.setAttribute(
      "aria-expanded",
      "true"
    );
    dashboardMenuToggle.setAttribute(
      "aria-label",
      "Close navigation menu"
    );
  }
}

function closeDashboardMenu() {
  dashboardNavigation.classList.remove("is-open");

  dashboardMenuToggle.setAttribute(
    "aria-expanded",
    "false"
  );

  dashboardMenuToggle.setAttribute(
    "aria-label",
    "Open navigation menu"
  );
}

function openBirdForm() {
  birdFormPanel.hidden = false;
  birdFormMessage.textContent = "";

  birdFormPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  document.querySelector("#bird-name").focus();
}

function closeBirdForm() {
  birdFormPanel.hidden = true;
  birdFormMessage.textContent = "";
  createBirdForm.reset();
}

async function handleCreateBird(event) {
  event.preventDefault();

  const formData = new FormData(createBirdForm);
  const photo = formData.get("birdPhoto");

  if (!(photo instanceof File) || photo.size === 0) {
    birdFormMessage.textContent =
      "Choose or take a photo before saving.";
    return;
  }

  const maxFileSize = 25 * 1024 * 1024;

  if (photo.size > maxFileSize) {
    birdFormMessage.textContent =
      "The photo must be 25 MB or smaller.";
    return;
  }

  const contentType = getImageContentType(photo);

  if (!contentType) {
    birdFormMessage.textContent =
      "Use a JPEG, PNG, WebP, HEIC or HEIF image.";
    return;
  }

  saveBirdButton.disabled = true;
  saveBirdButton.textContent = "Saving...";
  birdFormMessage.textContent = "Creating draft...";

  const birdData = {
    birdName: formData.get("birdName"),
    category: formData.get("category"),
    species: formData.get("species"),
    ageText: formData.get("ageText"),
    sex: formData.get("sex"),
    shortDescription:
      formData.get("shortDescription"),
    fullDescription:
      formData.get("fullDescription")
  };

  let createdBird;

  try {
    const session = await fetchAuthSession();

    const accessToken =
      session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new Error("Your session has expired.");
    }

    const createResponse = await fetch(
      `${API_URL}/admin/birds`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify(birdData)
      }
    );

    const createResult = await createResponse.json();

    if (!createResponse.ok) {
      const missingFields =
        createResult.fields?.length > 0
          ? ` Missing: ${createResult.fields.join(", ")}.`
          : "";

      throw new Error(
        `${createResult.message ??
        "Unable to create bird."}${missingFields}`
      );
    }

    createdBird = createResult.bird;

    birdFormMessage.textContent =
      "Uploading original photo...";

    await uploadOriginalBirdPhoto({
      birdId: createdBird.birdId,
      photo,
      contentType,
      accessToken
    });

    closeBirdForm();
    await showDashboard();

    dashboardMessage.textContent =
      `${createdBird.birdName} was created and the original photo was uploaded.`;
  } catch (error) {
    console.error(error);

    /*
     * If DynamoDB creation worked but S3 uploading failed,
     * close the form to prevent creating a duplicate bird
     * by submitting it again.
     */
    if (createdBird) {
      closeBirdForm();
      await showDashboard();

      dashboardMessage.textContent =
        `${createdBird.birdName} was created as a draft, ` +
        `but the photo upload failed: ${error.message}`;

      return;
    }

    birdFormMessage.textContent =
      error.message || "Unable to create the bird.";
  } finally {
    saveBirdButton.disabled = false;
    saveBirdButton.textContent = "Save draft";
  }
}

async function uploadOriginalBirdPhoto({
  birdId,
  photo,
  contentType,
  accessToken
}) {
  const urlResponse = await fetch(
    `${API_URL}/admin/birds/${encodeURIComponent(
      birdId
    )}/upload-url`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        contentType,
        fileSize: photo.size
      })
    }
  );

  const urlResult = await urlResponse.json();

  if (!urlResponse.ok) {
    throw new Error(
      urlResult.message ??
      "Unable to prepare the photo upload."
    );
  }

  const uploadResponse = await fetch(
    urlResult.uploadUrl,
    {
      method: "PUT",

      headers: {
        "Content-Type": contentType
      },

      body: photo
    }
  );

  if (!uploadResponse.ok) {
    throw new Error(
      `S3 upload returned ${uploadResponse.status}.`
    );
  }

  return {
    uploadKey: urlResult.uploadKey,
    uploadId: urlResult.uploadId
  };
}

function getImageContentType(file) {
  const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif"
  ]);

  const reportedType =
    file.type?.toLowerCase();

  if (allowedTypes.has(reportedType)) {
    return reportedType;
  }

  const extension =
    file.name.split(".").pop()?.toLowerCase();

  const typesByExtension = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif"
  };

  return typesByExtension[extension] ?? null;
}
