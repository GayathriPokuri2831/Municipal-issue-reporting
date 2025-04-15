document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Common functionality
    let issues = JSON.parse(localStorage.getItem("issues")) || [];

    function saveIssues() {
        localStorage.setItem("issues", JSON.stringify(issues));
    }

    // Generate random application ID (e.g., APP-XXXXXX)
    function generateApplicationId() {
        const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
        return `APP-${randomNum}`;
    }

    // Convert file to Base64 string
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // Home Page - Issue Reporting (Citizen Form)
    if (currentPage === "index.html" || currentPage === "") {
        const issueForm = document.getElementById("issueForm");
        const photoUpload = document.getElementById("photoUpload");
        const photoPreviews = document.getElementById("photoPreviews");
        let previewFiles = [];

        photoUpload.addEventListener("change", (e) => {
            const files = Array.from(e.target.files);
            const totalPhotos = previewFiles.length + files.length;

            // Enforce 5-photo limit
            if (totalPhotos > 5) {
                alert("You can upload a maximum of 5 photos. Please remove some photos or select fewer files.");
                e.target.value = ""; // Clear the input to prevent exceeding the limit
                return;
            }

            // Clear existing previews and update with new files
            previewFiles = [];
            photoPreviews.innerHTML = "";

            files.forEach(file => {
                const url = URL.createObjectURL(file);
                previewFiles.push({ file, url });
                const previewDiv = document.createElement("div");
                previewDiv.className = "preview-item";
                previewDiv.style.position = "relative";
                previewDiv.innerHTML = `
                    <img src="${url}" alt="${file.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; border: 2px solid black;">
                    <button class="remove-photo" data-index="${previewFiles.length - 1}">×</button>
                `;
                photoPreviews.appendChild(previewDiv);
            });

            // Add event listeners for removing photos
            document.querySelectorAll(".remove-photo").forEach(btn => {
                btn.addEventListener("click", (event) => {
                    const index = parseInt(event.target.dataset.index);
                    previewFiles = previewFiles.filter((_, i) => i !== index);
                    photoPreviews.innerHTML = previewFiles.map((item, i) => `
                        <div class="preview-item" style="position: relative;">
                            <img src="${item.url}" alt="${item.file.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; border: 2px solid black;">
                            <button class="remove-photo" data-index="${i}">×</button>
                        </div>
                    `).join('');

                    // Reattach event listeners after re-rendering
                    document.querySelectorAll(".remove-photo").forEach(newBtn => {
                        newBtn.addEventListener("click", (e) => {
                            const newIndex = parseInt(e.target.dataset.index);
                            previewFiles = previewFiles.filter((_, i) => i !== newIndex);
                            photoPreviews.innerHTML = previewFiles.map((item, i) => `
                                <div class="preview-item" style="position: relative;">
                                    <img src="${item.url}" alt="${item.file.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; border: 2px solid black;">
                                    <button class="remove-photo" data-index="${i}">×</button>
                                </div>
                            `).join('');
                        });
                    });
                });
            });
        });

        issueForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const applicationId = generateApplicationId();

            // Convert all uploaded photos to Base64
            const photos = await Promise.all(previewFiles.map(async (item) => {
                const base64 = await fileToBase64(item.file);
                return { name: item.file.name, url: base64 };
            }));

            const newIssue = {
                id: issues.length + 1,
                type: document.getElementById("issueType").value,
                location: document.getElementById("location").value,
                description: document.getElementById("description").value,
                name: document.getElementById("name").value,
                phone: document.getElementById("phone").value,
                email: document.getElementById("email").value,
                applicationId: applicationId,
                status: "pending",
                timestamp: new Date().toISOString(),
                votes: 0,
                photos: photos,
                feedback: "" // Initialize feedback as empty
            };
            issues = [newIssue, ...issues];
            saveIssues();
            alert(`Issue reported successfully! Your Application ID is: ${applicationId}\nThis ID has been sent to ${newIssue.email} and ${newIssue.phone}.`);
            issueForm.reset();
            previewFiles = [];
            photoPreviews.innerHTML = "";
        });
    }

    // Login Page
    if (currentPage === "login.html") {
        const loginForm = document.getElementById("loginForm");
        const loginError = document.getElementById("loginError");
        
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            if (username === "admin" && password === "admin123") {
                localStorage.setItem("isLoggedIn", "true");
                window.location.href = "dashboard.html";
            } else {
                loginError.textContent = "Invalid username or password!";
            }
        });
    }

    // Dashboard Page
    if (currentPage === "dashboard.html") {
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        if (!isLoggedIn) {
            window.location.href = "login.html";
            return;
        }

        const issuesList = document.getElementById("issuesList");
        const logoutBtn = document.getElementById("logoutBtn");
        const clearIssuesBtn = document.getElementById("clearIssuesBtn");

        function renderIssues() {
            issuesList.innerHTML = "";
            issues.forEach(issue => {
                const issueCard = document.createElement("div");
                issueCard.className = "issue-card";
                issueCard.innerHTML = `
                    <div class="details">
                        <h3>${issue.type}</h3>
                        <div><span class="location">Application ID:</span> ${issue.applicationId}</div>
                        <div><span class="location">Location:</span> ${issue.location}</div>
                        <div><span class="timestamp">Date:</span> ${new Date(issue.timestamp).toLocaleString()}</div>
                        <div><span class="name">Name:</span> ${issue.name}</div>
                        <div><span class="phone">Phone:</span> ${issue.phone}</div>
                        <div><span class="email">Email:</span> ${issue.email}</div>
                        <p>${issue.description}</p>
                        ${issue.photos.length > 0 ? `
                            <div class="issue-photos">
                                ${issue.photos.map(photo => `
                                    <img src="${photo.url}" alt="${photo.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; border: 2px solid black;">
                                `).join('')}
                            </div>
                        ` : ''}
                        ${issue.feedback ? `
                            <div class="feedback-display">
                                <strong>Feedback:</strong> ${issue.feedback}
                            </div>
                        ` : ''}
                    </div>
                    <div class="actions">
                        <span class="status ${issue.status}">${issue.status}</span>
                    </div>
                `;
                issuesList.appendChild(issueCard);
            });
        }

        clearIssuesBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to delete all issues? This action cannot be undone.")) {
                issues = [];
                saveIssues();
                renderIssues();
                alert("All issues have been cleared.");
            }
        });

        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("isLoggedIn");
            window.location.href = "index.html";
        });

        renderIssues();
    }

    // Admin Track Issues Page
    if (currentPage === "track.html") {
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        if (!isLoggedIn) {
            window.location.href = "login.html";
            return;
        }

        const trackIssuesList = document.getElementById("trackIssuesList");
        const logoutBtn = document.getElementById("logoutBtn");
        const statusFilter = document.getElementById("statusFilter");
        const searchInput = document.getElementById("searchInput");

        function renderTrackIssues(filteredIssues = issues) {
            trackIssuesList.innerHTML = "";
            filteredIssues.forEach(issue => {
                const issueCard = document.createElement("div");
                issueCard.className = "issue-card";
                issueCard.innerHTML = `
                    <div class="details">
                        <h3>${issue.type}</h3>
                        <div><span class="location">Application ID:</span> ${issue.applicationId}</div>
                        <div><span class="location">Location:</span> ${issue.location}</div>
                        <div><span class="timestamp">Date:</span> ${new Date(issue.timestamp).toLocaleString()}</div>
                        <div><span class="name">Name:</span> ${issue.name}</div>
                        <div><span class="phone">Phone:</span> ${issue.phone}</div>
                        <div><span class="email">Email:</span> ${issue.email}</div>
                        <p>${issue.description}</p>
                        ${issue.photos.length > 0 ? `
                            <div class="issue-photos">
                                ${issue.photos.map(photo => `
                                    <img src="${photo.url}" alt="${photo.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; border: 2px solid black;">
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="actions">
                        <select class="status-select" data-id="${issue.id}">
                            <option value="pending" ${issue.status === "pending" ? "selected" : ""}>Pending</option>
                            <option value="in-progress" ${issue.status === "in-progress" ? "selected" : ""}>In Progress</option>
                            <option value="resolved" ${issue.status === "resolved" ? "selected" : ""}>Done</option>
                        </select>
                    </div>
                `;
                trackIssuesList.appendChild(issueCard);
            });

            document.querySelectorAll(".status-select").forEach(select => {
                select.addEventListener("change", (e) => {
                    const issueId = parseInt(e.target.dataset.id);
                    const newStatus = e.target.value;
                    issues = issues.map(issue => 
                        issue.id === issueId ? { ...issue, status: newStatus } : issue
                    );
                    saveIssues();
                    applyFiltersAndSearch();
                });
            });
        }

        function applyFiltersAndSearch() {
            const status = statusFilter.value;
            const searchTerm = searchInput.value.toLowerCase();

            let filteredIssues = issues;
            if (status !== "all") {
                filteredIssues = filteredIssues.filter(issue => issue.status === status);
            }
            if (searchTerm) {
                filteredIssues = filteredIssues.filter(issue => 
                    issue.type.toLowerCase().includes(searchTerm) ||
                    issue.location.toLowerCase().includes(searchTerm) ||
                    issue.description.toLowerCase().includes(searchTerm) ||
                    issue.name.toLowerCase().includes(searchTerm) ||
                    issue.phone.toLowerCase().includes(searchTerm) ||
                    issue.email.toLowerCase().includes(searchTerm) ||
                    issue.applicationId.toLowerCase().includes(searchTerm) ||
                    (issue.feedback && issue.feedback.toLowerCase().includes(searchTerm)) // Include feedback in search
                );
            }
            renderTrackIssues(filteredIssues);
        }

        statusFilter.addEventListener("change", applyFiltersAndSearch);
        searchInput.addEventListener("input", applyFiltersAndSearch);

        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("isLoggedIn");
            window.location.href = "index.html";
        });

        renderTrackIssues();
    }

    // Citizen Track Issues Page
    if (currentPage === "citizen-track.html") {
        const applicationIdInput = document.getElementById("applicationIdInput");
        const trackBtn = document.getElementById("trackBtn");
        const issueDetails = document.getElementById("issueDetails");
        const trackError = document.getElementById("trackError");
        const feedbackForm = document.getElementById("feedbackForm");
        const feedbackInput = document.getElementById("feedbackInput");
        const submitFeedbackBtn = document.getElementById("submitFeedbackBtn");
        const feedbackSuccess = document.getElementById("feedbackSuccess");
        let currentIssue = null; // To store the tracked issue for feedback

        function renderCitizenIssue(issue) {
            issueDetails.innerHTML = "";
            feedbackForm.style.display = "none"; // Hide feedback form initially
            feedbackSuccess.style.display = "none"; // Hide success message initially

            if (issue) {
                currentIssue = issue; // Store the current issue for feedback submission
                const issueCard = document.createElement("div");
                issueCard.className = "issue-card";
                issueCard.innerHTML = `
                    <div class="details">
                        <h3>${issue.type}</h3>
                        <div><span class="location">Application ID:</span> ${issue.applicationId}</div>
                        <div><span class="location">Location:</span> ${issue.location}</div>
                        <div><span class="timestamp">Date:</span> ${new Date(issue.timestamp).toLocaleString()}</div>
                        <div><span class="name">Name:</span> ${issue.name}</div>
                        <div><span class="phone">Phone:</span> ${issue.phone}</div>
                        <div><span class="email">Email:</span> ${issue.email}</div>
                        <p>${issue.description}</p>
                        ${issue.photos.length > 0 ? `
                            <div class="issue-photos">
                                ${issue.photos.map(photo => `
                                    <img src="${photo.url}" alt="${photo.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; border: 2px solid black;">
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="actions">
                        <span class="status ${issue.status}">${issue.status}</span>
                    </div>
                `;
                issueDetails.appendChild(issueCard);
                trackError.textContent = "";
                feedbackForm.style.display = "block"; // Show feedback form after tracking
                feedbackInput.value = issue.feedback || ""; // Pre-fill with existing feedback if any
            } else {
                issueDetails.innerHTML = "";
                trackError.textContent = "No issue found with this Application ID.";
                currentIssue = null; // Clear current issue if none found
            }
        }

        trackBtn.addEventListener("click", () => {
            const applicationId = applicationIdInput.value.trim().toUpperCase();
            const issue = issues.find(issue => issue.applicationId === applicationId);
            renderCitizenIssue(issue);
        });

        applicationIdInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                trackBtn.click();
            }
        });

        submitFeedbackBtn.addEventListener("click", () => {
            if (!currentIssue) {
                trackError.textContent = "Please track an issue before submitting feedback.";
                return;
            }

            const feedbackText = feedbackInput.value.trim();
            if (!feedbackText) {
                trackError.textContent = "Feedback cannot be empty.";
                return;
            }

            // Update the issue with feedback
            issues = issues.map(issue => 
                issue.applicationId === currentIssue.applicationId ? { ...issue, feedback: feedbackText } : issue
            );
            saveIssues();

            // Update UI
            trackError.textContent = "";
            feedbackSuccess.style.display = "block";
            setTimeout(() => feedbackSuccess.style.display = "none", 3000); // Hide success message after 3 seconds
            renderCitizenIssue(currentIssue); // Re-render to reflect any changes
        });
    }
});