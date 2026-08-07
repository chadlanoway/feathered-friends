import "./style.css";

const API_URL = "https://7cpncscbj5.execute-api.us-east-1.amazonaws.com";

const form = document.querySelector("#volunteer-form");
const submitButton = document.querySelector("#volunteer-submit-button");
const errorMessage = document.querySelector("#volunteer-form-error");
const successPanel = document.querySelector("#volunteer-success");
const confirmationNumber = document.querySelector("#volunteer-confirmation");
const conditionalFields = document.querySelectorAll("[data-condition-field]");
const checkboxConditionalFields = document.querySelectorAll("[data-checkbox-condition]");

function updateConditionalField(container) {
  const controllingField = form.elements.namedItem(container.dataset.conditionField);
  const expectedValues = (container.dataset.conditionValues || container.dataset.conditionValue || "")
    .split(",")
    .map((value) => value.trim());
  const shouldShow = expectedValues.includes(controllingField?.value);

  setConditionalVisibility(container, shouldShow);
}

function updateCheckboxConditionalField(container) {
  const controllingName = container.dataset.checkboxCondition;
  const expectedValue = container.dataset.conditionValue;
  const selectedValues = new FormData(form).getAll(controllingName);
  setConditionalVisibility(container, selectedValues.includes(expectedValue));
}

function setConditionalVisibility(container, shouldShow) {
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
  checkboxConditionalFields.forEach(updateCheckboxConditionalField);
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

function agreementSection(formData, prefix) {
  const agreement = section(formData, prefix);
  agreement.accepted = agreement.accepted === "true";
  return agreement;
}

function createPayload() {
  const formData = new FormData(form);
  const tasks = section(formData, "tasks");
  tasks.selected = formData.getAll("tasks.selected");

  return {
    website: fieldValue(formData, "website"),
    contact: section(formData, "contact"),
    children: section(formData, "children"),
    availability: section(formData, "availability"),
    experience: section(formData, "experience"),
    tasks,
    additional: section(formData, "additional"),
    liability: agreementSection(formData, "liability"),
    confidentiality: agreementSection(formData, "confidentiality"),
    mediaRelease: agreementSection(formData, "mediaRelease")
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

function hasSelectedTask() {
  return form.querySelectorAll('input[name="tasks.selected"]:checked').length > 0;
}

conditionalFields.forEach((container) => {
  const controllingField = form.elements.namedItem(container.dataset.conditionField);
  controllingField?.addEventListener("change", () => updateConditionalField(container));
});

form.querySelectorAll('input[name="tasks.selected"]').forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    checkboxConditionalFields.forEach(updateCheckboxConditionalField);
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();
  updateAllConditionalFields();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  if (!hasSelectedTask()) {
    showError("Please select at least one volunteer task.");
    document.querySelector("#volunteer-task-options")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  form.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(`${API_URL}/forms/volunteers`, {
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
    submitButton.textContent = "Submit volunteer application";
    form.removeAttribute("aria-busy");
  }
});

const today = new Date().toISOString().slice(0, 10);
document.querySelectorAll(".volunteer-agreement-date").forEach((dateField) => {
  dateField.value = today;
  dateField.max = today;
});
document.querySelector("#volunteer-date-of-birth").max = today;

updateAllConditionalFields();
