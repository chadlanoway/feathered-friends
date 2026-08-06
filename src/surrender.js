const API_URL = "https://7cpncscbj5.execute-api.us-east-1.amazonaws.com";

const form = document.querySelector("#surrender-form");
const submitButton = document.querySelector("#surrender-submit-button");
const errorMessage = document.querySelector("#surrender-form-error");
const successPanel = document.querySelector("#surrender-success");
const confirmationNumber = document.querySelector("#surrender-confirmation");
const conditionalFields = document.querySelectorAll("[data-condition-field]");

function updateConditionalField(container) {
    const controllingName = container.dataset.conditionField;
    const expectedValue = container.dataset.conditionValue;
    const controllingField = form.elements.namedItem(controllingName);
    const shouldShow = controllingField?.value === expectedValue;

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
    const agreement = section(formData, "agreement");
    const identification = section(formData, "identification");

    agreement.accepted = agreement.accepted === "true";

    if (
        identification.species === "Other" &&
        identification.otherSpecies
    ) {
        identification.speciesCategory = "Other";
        identification.species = identification.otherSpecies;
    }

    return {
        website: fieldValue(formData, "website"),
        contact: section(formData, "contact"),
        identification,
        health: section(formData, "health"),
        diet: section(formData, "diet"),
        behavior: section(formData, "behavior"),
        belongings: section(formData, "belongings"),
        surrenderDetails: section(formData, "surrenderDetails"),
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

conditionalFields.forEach((container) => {
    const controllingField = form.elements.namedItem(
        container.dataset.conditionField
    );

    controllingField?.addEventListener("change", () => {
        updateConditionalField(container);
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

    submitButton.disabled = true;
    submitButton.textContent = "Submitting…";
    form.setAttribute("aria-busy", "true");

    try {
        const response = await fetch(`${API_URL}/forms/surrenders`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(createPayload())
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.message || "We could not submit your request. Please try again."
            );
        }

        confirmationNumber.textContent = result.submissionId;
        form.hidden = true;
        successPanel.hidden = false;
        successPanel.focus();
        successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
        showError(
            error.message || "We could not submit your request. Please try again."
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit surrender request";
        form.removeAttribute("aria-busy");
    }
});

updateAllConditionalFields();