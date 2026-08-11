const API_URL = "https://7cpncscbj5.execute-api.us-east-1.amazonaws.com";

const form = document.querySelector("#boarding-form");
const submitButton = document.querySelector("#boarding-submit-button");
const errorMessage = document.querySelector("#boarding-form-error");
const successPanel = document.querySelector("#boarding-success");
const confirmationNumber = document.querySelector("#boarding-confirmation");
const conditionalFields = document.querySelectorAll("[data-condition-field]");

function expectedValues(container) {
  return (container.dataset.conditionValues || container.dataset.conditionValue || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function updateConditionalField(container) {
  const controllingField = form.elements.namedItem(container.dataset.conditionField);
  const shouldShow = expectedValues(container).includes(controllingField?.value);

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

function section(formData, prefix) {
  const result = {};

  for (const [name, rawValue] of formData.entries()) {
    if (!name.startsWith(`${prefix}.`)) continue;
    const fieldName = name.slice(prefix.length + 1);
    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
    if (value === "") continue;

    if (Object.hasOwn(result, fieldName)) {
      result[fieldName] = Array.isArray(result[fieldName])
        ? [...result[fieldName], value]
        : [result[fieldName], value];
    } else {
      result[fieldName] = value;
    }
  }

  return result;
}

function createPayload() {
  const formData = new FormData(form);
  const agreement = section(formData, "agreement");
  agreement.accepted = agreement.accepted === "true";

  return {
    website: String(formData.get("website") || "").trim(),
    bird: section(formData, "bird"),
    owner: section(formData, "owner"),
    emergencyContact: section(formData, "emergencyContact"),
    veterinarian: section(formData, "veterinarian"),
    health: section(formData, "health"),
    diseaseTesting: section(formData, "diseaseTesting"),
    exposure: section(formData, "exposure"),
    diet: section(formData, "diet"),
    care: section(formData, "care"),
    belongings: section(formData, "belongings"),
    additionalInformation: section(formData, "additionalInformation"),
    schedule: section(formData, "schedule"),
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

function validateDates() {
  const startDate = form.elements.namedItem("schedule.startDate").value;
  const endDate = form.elements.namedItem("schedule.endDate").value;
  const endField = form.elements.namedItem("schedule.endDate");

  endField.setCustomValidity("");
  if (startDate && endDate && endDate < startDate) {
    endField.setCustomValidity("Pickup date cannot be before the boarding start date.");
    endField.reportValidity();
    return false;
  }
  return true;
}

conditionalFields.forEach((container) => {
  form.elements.namedItem(container.dataset.conditionField)?.addEventListener("change", () => {
    updateConditionalField(container);
  });
});

form.elements.namedItem("schedule.startDate").addEventListener("change", validateDates);
form.elements.namedItem("schedule.endDate").addEventListener("change", validateDates);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();
  updateAllConditionalFields();

  if (!form.checkValidity() || !validateDates()) {
    form.reportValidity();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  form.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(`${API_URL}/forms/boardings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createPayload())
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "We could not submit your request. Please try again.");

    confirmationNumber.textContent = result.submissionId;
    form.hidden = true;
    successPanel.hidden = false;
    successPanel.focus();
    successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showError(error.message || "We could not submit your request. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit boarding request";
    form.removeAttribute("aria-busy");
  }
});

updateAllConditionalFields();
