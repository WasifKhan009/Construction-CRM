

/************************************************
 * 1. SECURITY GUARD & AUTHENTICATION
 ************************************************/
(function() {
    const isAuthenticated = localStorage.getItem("isLoggedIn");
    const isLoginPage = window.location.pathname.includes("login.html");

    // Redirect to login if trying to access protected pages while logged out
    if (!isAuthenticated && !isLoginPage) {
        window.location.href = "login.html";
    }
})();

async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById("login-username").value;
    const pass = document.getElementById("login-password").value;

    try {
        const response = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });

        if (response.ok) {
            const data = await response.json();
            
            // Mark as logged in and save user info
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userName", user);
            
            alert("Welcome back! " + (data.message || "Login Successful"));
            window.location.href = "dashboard.html";
        } else {
            const alertBox = document.getElementById("login-alert");
            if (alertBox) {
                alertBox.innerHTML = `<div class="alert alert-danger">Invalid Username or Password!</div>`;
            } else {
                alert("Invalid Credentials");
            }
        }
    } catch (err) {
        console.error("Connection Error:", err);
        alert("Cannot connect to backend. Make sure IntelliJ is running!");
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const signupData = {
        name: document.getElementById("signup-name").value,
        email: document.getElementById("signup-email").value,
        username: document.getElementById("signup-username").value,
        password: document.getElementById("signup-password").value,
        role: document.getElementById("signup-role").value
    };

    try {
        const response = await fetch("http://localhost:8080/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(signupData)
        });

        if (response.ok) {
            alert("Signup successful! Please login.");
            window.location.reload(); 
        } else {
            const errorText = await response.text();
            alert("Signup failed: " + errorText);
        }
    } catch (err) {
        console.error("Signup Error:", err);
    }
}

function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    window.location.href = "login.html";
}

/************************************************
 * GLOBAL INITIALIZER
 ************************************************/
document.addEventListener("DOMContentLoaded", function () {
  const pageId = document.body.id;
  
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
      loginForm.addEventListener("submit", handleLogin);
  }

  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
      signupForm.addEventListener("submit", handleSignup);
  }

  if (pageId === "dashboard-page") initDashboard();
  if (pageId === "projects-page") initProjects();
  if (pageId === "change-orders-page") initChangeOrders();
  if (pageId === "claims-page") initClaims();
});

/************************************************
 * DASHBOARD PAGE LOGIC
 ************************************************/
async function initDashboard() {
  try {
    // 1. Fetch Projects and Change Orders in parallel
    const [projectRes, coRes] = await Promise.all([
      fetch("http://localhost:8080/api/projects"),
      fetch("http://localhost:8080/api/change-orders")
    ]);

    const projects = await projectRes.json();
    const changeOrders = await coRes.json();

    // 2. Calculate Statistics
    const totalProjects = projects.length;
    
    // Total Portfolio Value (Sum of all original budgets)
    const totalBudget = projects.reduce((sum, p) => sum + (p.originalBudget || 0), 0);

    // Total Approved Variations (Sum of all ACCEPTED change orders)
    const totalApprovedCOs = changeOrders
      .filter(co => co.status === 'ACCEPTED')
      .reduce((sum, co) => sum + (co.amount || 0), 0);

    // Pending Actions (Change orders that need a decision)
    const pendingCOs = changeOrders.filter(co => co.status === 'PENDING').length;

    // 3. Update the UI Cards
    // Make sure these IDs exist in your dashboard.html
    document.getElementById("stat-total-projects").innerText = totalProjects;
    document.getElementById("stat-portfolio-value").innerText = `$${totalBudget.toLocaleString()}`;
    document.getElementById("stat-approved-variations").innerText = `$${totalApprovedCOs.toLocaleString()}`;
    document.getElementById("stat-pending-actions").innerText = pendingCOs;

    // 4. Optional: Add a "Project Health" summary list to the dashboard
    const healthList = document.getElementById("dashboard-project-summary");
    if (healthList) {
        healthList.innerHTML = "";
        projects.slice(0, 5).forEach(p => { // Show top 5 projects
            const approvedForThisProject = changeOrders
                .filter(co => co.projectId == p.id && co.status === 'ACCEPTED')
                .reduce((sum, co) => sum + (co.amount || 0), 0);
            
            const percent = p.originalBudget > 0 
                ? ((approvedForThisProject / p.originalBudget) * 100).toFixed(1) 
                : 0;

            healthList.innerHTML += `
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <span>${p.projectName}</span>
                        <span class="text-muted">${percent}% budget utilized</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar ${percent > 10 ? 'bg-danger' : 'bg-success'}" 
                             style="width: ${percent}%"></div>
                    </div>
                </div>`;
        });
    }
  } catch (err) {
    console.error("Dashboard Update Error:", err);
  }
}

/************************************************
 * PROJECTS PAGE LOGIC
 ************************************************/
function initProjects() {
  const tableBody = document.getElementById("projects-table-body");
  const projectForm = document.getElementById("project-form");

  // 1. Fetch and Display Table
  fetch("http://localhost:8080/api/projects")
    .then(res => res.json())
    .then(data => {
      if (tableBody) {
        tableBody.innerHTML = "";
        data.forEach(p => {
          tableBody.innerHTML += `
            <tr>
              <td>${p.projectName}</td>
              <td>${p.projectNumber}</td>
              <td><span class="badge ${getStatusBadgeColor(p.status)}">${p.status}</span></td>
              <td>
                <button class="btn btn-sm btn-info text-white" onclick="viewProjectDetails(${p.id})">View</button>
                <button class="btn btn-sm btn-warning" onclick="openEditModal(${p.id}, '${p.projectName}', '${p.projectNumber}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProject(${p.id})">Delete</button>
              </td>
            </tr>`;
        });
      }
    })
    .catch(error => showAlert("Could not connect to the backend server.", "danger"));

  // 2. Handle New Project Submission (FormData for Files + Fields)
  if (projectForm && !projectForm.dataset.listenerAttached) {
    projectForm.dataset.listenerAttached = "true";
    projectForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData();
      formData.append("projectName", document.getElementById("modal-project-name").value);
      formData.append("projectNumber", document.getElementById("modal-project-number").value);
      formData.append("status", "Active");
      formData.append("originalBudget", document.getElementById("modal-project-budget").value);
      formData.append("startDate", document.getElementById("modal-project-start").value);
      formData.append("endDate", document.getElementById("modal-project-end").value);

      const fileInput = document.getElementById("modal-project-file");
      if (fileInput && fileInput.files.length > 0) {
        formData.append("file", fileInput.files[0]);
      }

      fetch("http://localhost:8080/api/projects", {
        method: "POST",
        body: formData // No headers needed for FormData
      })
      .then(response => {
        if (response.ok) {
          const modal = bootstrap.Modal.getInstance(document.getElementById('projectModal'));
          modal.hide();
          projectForm.reset();
          initProjects();
          showAlert("Project Initialized Successfully!", "success");
        }
      })
      .catch(err => console.error("Upload Error:", err));
    });
  }

  // Edit Project Form Logic
  const editProjectForm = document.getElementById("edit-project-form");
  if (editProjectForm && !editProjectForm.dataset.listenerAttached) {
    editProjectForm.dataset.listenerAttached = "true";
    editProjectForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const id = document.getElementById("edit-project-id").value;
      const updatedProject = {
        projectName: document.getElementById("edit-project-name").value,
        projectNumber: document.getElementById("edit-project-number").value
      };

      fetch(`http://localhost:8080/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject)
      })
      .then(() => {
        const modalElement = document.getElementById('editProjectModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
        initProjects();
        showAlert("Project updated successfully!", "success");
      });
    });
  }
}

// 3. The "View Details" Dashboard Logic
async function viewProjectDetails(id) {
  try {
    const projectRes = await fetch(`http://localhost:8080/api/projects/${id}`);
    const project = await projectRes.json();
    
    // We fetch Change Orders to calculate the financial progress bar
    const coRes = await fetch(`http://localhost:8080/api/change-orders`);
    const allCOs = await coRes.json();

    const approvedCOTotal = allCOs
      .filter(co => co.projectId == id && co.status === 'ACCEPTED')
      .reduce((sum, co) => sum + (co.amount || 0), 0);
    
    const budgetUsagePercent = project.originalBudget > 0 
      ? Math.min((approvedCOTotal / project.originalBudget) * 100, 100).toFixed(1) 
      : 0;

    const content = document.getElementById("view-project-content");
    content.innerHTML = `
      <div class="row mb-3">
        <div class="col-md-8">
          <h4>${project.projectName}</h4>
          <p class="text-muted mb-1">Project Number: ${project.projectNumber}</p>
          <p><strong>Schedule:</strong> ${project.startDate || 'TBD'} to ${project.endDate || 'TBD'}</p>
        </div>
        <div class="col-md-4 text-end">
          <span class="badge ${getStatusBadgeColor(project.status)} fs-6">${project.status}</span>
        </div>
      </div>

      <div class="card p-3 mb-4 shadow-sm">
        <h6>Financial Progress (Budget vs. Approved Changes)</h6>
        <div class="progress mb-2" style="height: 30px;">
          <div class="progress-bar ${budgetUsagePercent > 80 ? 'bg-danger' : 'bg-success'}" 
               role="progressbar" style="width: ${budgetUsagePercent}%">
               ${budgetUsagePercent}%
          </div>
        </div>
        <div class="d-flex justify-content-between">
            <small>Original Budget: $${(project.originalBudget || 0).toLocaleString()}</small>
            <small>Approved Variations: $${approvedCOTotal.toLocaleString()}</small>
        </div>
      </div>

      <h6>Project Documents</h6>
      ${project.documentName ? 
        `<div class="alert alert-light border d-flex justify-content-between align-items-center">
           <span><i class="bi bi-file-earmark-pdf"></i> ${project.documentName}</span>
           <a href="http://localhost:8080/api/projects/${project.id}/download" class="btn btn-sm btn-outline-primary">Download</a>
         </div>` : 
        '<p class="text-muted small">No documents attached.</p>'}
    `;

    new bootstrap.Modal(document.getElementById('viewProjectModal')).show();
  } catch (err) {
    console.error("View Details Error:", err);
  }
}

function openEditModal(id, name, number) {
  document.getElementById("edit-project-id").value = id;
  document.getElementById("edit-project-name").value = name;
  document.getElementById("edit-project-number").value = number;
  new bootstrap.Modal(document.getElementById('editProjectModal')).show();
}

function deleteProject(id) {
  if (confirm("Are you sure you want to delete this project?")) {
    fetch(`http://localhost:8080/api/projects/${id}`, { method: "DELETE" })
    .then(() => {
      initProjects();
      showAlert("Project deleted.", "info");
    });
  }
}

/************************************************
 * CHANGE ORDER LOGIC
 ************************************************/
function initChangeOrders() {
    const coForm = document.getElementById("co-form");
    const projectSelect = document.getElementById("modal-co-project-id");

    // 1. Fill the dropdown with existing projects
    fetch("http://localhost:8080/api/projects")
        .then(res => res.json())
        .then(projects => {
            if (projectSelect) {
                projectSelect.innerHTML = '<option value="">-- Choose Project --</option>';
                projects.forEach(p => {
                    projectSelect.innerHTML += `<option value="${p.id}">${p.projectName} (${p.projectNumber})</option>`;
                });
            }
        });

    // 2. Load the list of existing Change Orders
    loadCOList();

    // 3. Fixed Save Logic using addEventListener
    if (coForm && !coForm.dataset.listenerAttached) {
        coForm.dataset.listenerAttached = "true";
        
        coForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const newCO = {
                projectId: document.getElementById("modal-co-project-id").value,
                description: document.getElementById("modal-co-description").value,
                amount: parseFloat(document.getElementById("modal-co-amount").value),
                status: "PENDING"
            };

            fetch("http://localhost:8080/api/change-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCO)
            })
            .then(res => {
                if(res.ok) {
                    coForm.reset();
                    loadCOList();
                    // Alert user using the existing utility function
                    if (typeof showAlert === "function") {
                        showAlert("Change Order Saved Successfully!", "success");
                    } else {
                        alert("Change Order Saved!");
                    }
                } else {
                    alert("Error saving Change Order. Check backend.");
                }
            })
            .catch(err => console.error("Submit Error:", err));
        });
    }
}

function loadCOList() {
    const tableBody = document.getElementById("co-table-body");
    fetch("http://localhost:8080/api/change-orders")
        .then(res => res.json())
        .then(data => {
            if (tableBody) {
                tableBody.innerHTML = "";
                if (data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No change orders found.</td></tr>';
                    return;
                }
                data.forEach(co => {
                    tableBody.innerHTML += `
                        <tr>
                            <td>Project #${co.projectId}</td>
                            <td>${co.description}</td>
                            <td class="fw-bold">$${co.amount.toLocaleString()}</td>
                            <td><span class="badge ${co.status === 'ACCEPTED' ? 'bg-success' : 'bg-warning'}">${co.status}</span></td>
                            <td>
                                ${co.status === 'PENDING' ? 
                                    `<button class="btn btn-sm btn-outline-success" onclick="updateCOStatus(${co.id}, 'ACCEPTED')">Approve</button>` : 
                                    `<i class="bi bi-check-all text-success"> Authorized</i>`}
                            </td>
                        </tr>`;
                });
            }
        });
}

// Function to Approve a change order (This triggers the budget update!)
function updateCOStatus(id, newStatus) {
    fetch(`http://localhost:8080/api/change-orders/${id}/status?status=${newStatus}`, {
        method: "PUT"
    }).then(() => loadCOList());
}

/************************************************
 * CLAIMS PAGE LOGIC
 ************************************************/
async function initClaims() {
    const tableBody = document.getElementById("claims-table-body");
    const projectSelect = document.getElementById("modal-project-id");

    try {
        const projResponse = await fetch("http://localhost:8080/api/projects");
        const projects = await projResponse.json();
        const projectMap = {};

        if (projectSelect) projectSelect.innerHTML = '<option value="">-- Select a Project --</option>';
        
        projects.forEach(p => {
            projectMap[p.id] = p.projectName;
            if (projectSelect) {
                projectSelect.innerHTML += `<option value="${p.id}">${p.projectName}</option>`;
            }
        });

        const claimsResponse = await fetch("http://localhost:8080/api/claims");
        const claims = await claimsResponse.json();

        if (tableBody) {
            tableBody.innerHTML = "";
            claims.forEach(claim => {
                const projectName = projectMap[claim.projectId] || "Unknown Project";
                const isLate = claim.status === 'LATE';
                const statusClass = isLate ? 'bg-danger' : 'bg-success';
                
                const lateWarning = isLate ? 
                    `<br><small class="text-danger">⚠️ Notified after 28 days</small>` : '';

                const row = `
                    <tr>
                        <td>${projectName}</td>
                        <td>${claim.claimTitle}${lateWarning}</td>
                        <td>${claim.eventDate}</td>
                        <td>${claim.noticeDate}</td>
                        <td><span class="badge ${statusClass}">${claim.status}</span></td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        }
    } catch (err) {
        console.error("Error initializing claims:", err);
    }

    const claimForm = document.getElementById("claim-form");
    if (claimForm && !claimForm.dataset.listenerAttached) {
        claimForm.dataset.listenerAttached = "true";
        claimForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const eventDateValue = document.getElementById("modal-event-date").value;
            const today = new Date();

            const newClaim = {
                projectId: document.getElementById("modal-project-id").value,
                claimTitle: document.getElementById("modal-claim-title").value,
                eventDate: eventDateValue,
                noticeDate: today.toISOString().split('T')[0]
            };

            fetch("http://localhost:8080/api/claims", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newClaim)
            })
            .then(response => response.json())
            .then((savedClaim) => {
                bootstrap.Modal.getInstance(document.getElementById('claimModal')).hide();
                claimForm.reset();
                initClaims();
                const msg = savedClaim.status === "LATE" ? "⚠️ Submitted as LATE." : "✅ Submitted successfully.";
                showAlert(msg, savedClaim.status === "LATE" ? "warning" : "success");
            });
        });
    }
}

/************************************************
 * UTILITY FUNCTIONS
 ************************************************/
function getStatusBadgeColor(status) {
    switch(status) {
        case 'Tendering': return 'bg-secondary';
        case 'Active': return 'bg-success';
        case 'On-Hold': return 'bg-warning text-dark';
        case 'Practical Completion': return 'bg-info';
        case 'Archived': return 'bg-dark';
        default: return 'bg-primary';
    }
}

function showAlert(message, type) {
  const alertContainer = document.getElementById("alert-container");
  if (alertContainer) {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>`;
  }
}

/************************************************
 * PDF EXPORT LOGIC
 ************************************************/
function exportClaimsToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Construction Claims Report", 14, 22);
  doc.autoTable({ html: '.table', startY: 35, theme: 'grid' });
  doc.save(`Claims_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}