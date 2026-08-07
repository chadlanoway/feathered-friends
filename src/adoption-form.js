const API_URL = "https://7cpncscbj5.execute-api.us-east-1.amazonaws.com";

const form = document.querySelector("#adoption-form");
const submitButton = document.querySelector("#adoption-submit-button");
const errorMessage = document.querySelector("#adoption-form-error");
const successPanel = document.querySelector("#adoption-success");
const confirmationNumber = document.querySelector("#adoption-confirmation");
const conditionalFields = document.querySelectorAll("[data-condition-field]");
const agreementDate = document.querySelector("#agreement-date");

function updateConditionalField(container) {
  const controllingField = form.elements.namedItem(container.dataset.conditionField);
  const shouldShow = controllingField?.value === container.dataset.conditionValue;

  container.hidden = !shouldShow;

  container.querySelectorAll("input, select, textarea").forEach((field) => {
    field.disabled = !shouldShow;

    if (field.hasAttribute("data-required-when-visible")) {
      field.required = shouldShow;
    }
  });
}

function updateAllConditionalFields() {
  conditionalFields.forEach(updateConditionalField);
}

function fieldValue(formData, name) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function section(formData, prefix) {
  const result = {};

  for (const [name, rawValue] of formData.entries()) {
    if (!name.startsWith(`${prefix}.`)) {
      continue;
    }

    const fieldName = name.slice(prefix.length + 1);
    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

    if (value !== "") {
      result[fieldName] = value;
    }
  }

  return result;
}

function createPayload() {
  const formData = new FormData(form);
  const contact = section(formData, "contact");
  const agreement = section(formData, "agreement");

  contact.fullAddress = [
    contact.streetAddress,
    contact.city,
    contact.state,
    contact.zipCode
  ].filter(Boolean).join(", ");

  agreement.accepted = agreement.accepted === "true";

  return {
    website: fieldValue(formData, "website"),
    contact,
    applicant: section(formData, "applicant"),
    residence: section(formData, "residence"),
    household: section(formData, "household"),
    pets: section(formData, "pets"),
    adoptionInterest: section(formData, "adoptionInterest"),
    commitment: section(formData, "commitment"),
    careKnowledge: section(formData, "careKnowledge"),
    interaction: section(formData, "interaction"),
    reference: section(formData, "reference"),
    agreement
  };
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  errorMessage.focus();
  errorMessage.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.hidden = true;
}

function setSelectedBirdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const birdId = params.get("birdId")?.trim() || "";
  const birdName = params.get("birdName")?.trim() || "";
  const birdIdInput = document.querySelector("#selected-bird-id");
  const birdNameInput = document.querySelector("#selected-bird-name");
  const message = document.querySelector("#selected-bird-message");

  if (birdId) {
    birdIdInput.value = birdId;
  }

  if (birdName) {
    birdNameInput.value = birdName;
    message.textContent = `You are applying to adopt ${birdName}.`;
    message.hidden = false;
  }
}

function validateAge() {
  const ageAnswer = form.elements.namedItem("applicant.isAtLeast18")?.value;
  const birthDateValue = form.elements.namedItem("applicant.dateOfBirth")?.value;

  if (ageAnswer === "no") {
    showError("Applicants must be at least 18 years old.");
    return false;
  }

  if (birthDateValue) {
    const birthDate = new Date(`${birthDateValue}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    if (age < 18) {
      showError("Applicants must be at least 18 years old.");
      return false;
    }
  }

  return true;
}

conditionalFields.forEach((container) => {
  const controllingField = form.elements.namedItem(container.dataset.conditionField);
  controllingField?.addEventListener("change", () => updateConditionalField(container));
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();
  updateAllConditionalFields();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  if (!validateAge()) {
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  form.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(`${API_URL}/forms/adoptions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createPayload())
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || "We could not submit your application. Please try again.");
    }

    confirmationNumber.textContent = result.submissionId;
    form.hidden = true;
    successPanel.hidden = false;
    successPanel.focus();
    successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showError(error.message || "We could not submit your application. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit adoption application";
    form.removeAttribute("aria-busy");
  }
});

const today = new Date().toISOString().slice(0, 10);
agreementDate.value = today;
agreementDate.max = today;
form.elements.namedItem("applicant.dateOfBirth").max = today;

setSelectedBirdFromUrl();
updateAllConditionalFields();
