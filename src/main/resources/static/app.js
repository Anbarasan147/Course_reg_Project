// ================= GLOBAL STATE STORE =================
const state = {
    user: null, // { id, name, email, role, major }
    courses: [], // CourseDTO list from server
    registeredCourses: [], // CourseDTO list registered by current student
    cart: [], // Courses tentatively added to cart
    timeSlots: [], // Available timeslots from server
    activeFilters: {
        search: '',
        departments: new Set(),
        credits: new Set(['3', '4']),
        hideFull: false,
        sortBy: 'code'
    }
};

// ================= CONSTANTS & CONFIGS =================
const CREDIT_LIMIT = 18;

// ================= DOM ELEMENT REFERENCES =================
const elements = {
    // Overlays
    loading: document.getElementById('loading-overlay'),
    toastContainer: document.getElementById('toast-container'),
    
    // Auth
    authContainer: document.getElementById('auth-container'),
    loginForm: document.getElementById('login-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    
    // Header controls
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    userBadge: document.getElementById('user-badge'),
    userDisplayName: document.getElementById('user-display-name'),
    userDisplayRole: document.getElementById('user-display-role'),
    userAvatarInitials: document.getElementById('user-avatar-initials'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Dashboards
    studentDashboard: document.getElementById('student-dashboard'),
    adminDashboard: document.getElementById('admin-dashboard'),
    
    // Student Dashboard Details
    studentWelcomeName: document.getElementById('student-welcome-name'),
    studentWelcomeMajor: document.getElementById('student-welcome-major'),
    creditTrackerValue: document.getElementById('credit-tracker-value'),
    creditProgressBar: document.getElementById('credit-progress-bar'),
    creditPercentage: document.getElementById('credit-percentage'),
    
    // Catalog controls
    catalogSearch: document.getElementById('catalog-search'),
    catalogSort: document.getElementById('catalog-sort'),
    filterDepartments: document.getElementById('filter-departments'),
    filterHideFull: document.getElementById('filter-hide-full'),
    courseCatalogGrid: document.getElementById('course-catalog-grid'),
    
    // Cart Planner sidebar
    cartItemsContainer: document.getElementById('cart-items-container'),
    cartTotalCredits: document.getElementById('cart-total-credits'),
    cartValidationWarning: document.getElementById('cart-validation-warning'),
    cartWarningText: document.getElementById('cart-warning-text'),
    cartSubmitBtn: document.getElementById('cart-submit-btn'),
    cartBadgeCount: document.getElementById('cart-badge-count'),
    scheduleItemsContainer: document.getElementById('schedule-items-container'),
    
    // Admin dashboard details
    adminStatStudents: document.getElementById('admin-stat-students'),
    adminStatRevenue: document.getElementById('admin-stat-revenue'),
    adminStatPopular: document.getElementById('admin-stat-popular'),
    adminCoursesTbody: document.getElementById('admin-courses-tbody'),
    adminAddCourseBtn: document.getElementById('admin-add-course-btn'),
    
    // Modals
    courseModal: document.getElementById('course-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    courseForm: document.getElementById('course-form'),
    courseFormId: document.getElementById('course-form-id'),
    courseFormCode: document.getElementById('course-form-code'),
    courseFormTitle: document.getElementById('course-form-title'),
    courseFormDesc: document.getElementById('course-form-desc'),
    courseFormCredits: document.getElementById('course-form-credits'),
    courseFormCapacity: document.getElementById('course-form-capacity'),
    courseFormInstructor: document.getElementById('course-form-instructor'),
    courseFormDept: document.getElementById('course-form-dept'),
    courseFormTimeslot: document.getElementById('course-form-timeslot'),
    courseFormPrereqs: document.getElementById('course-form-prereqs'),
    courseFormCancelBtn: document.getElementById('course-form-cancel-btn'),
    courseFormSubmitBtn: document.getElementById('course-form-submit-btn')
};

// ================= TOAST NOTIFICATION HELPER =================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <div class="toast-body">
            <p>${message}</p>
        </div>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto remove toast
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}

// Add CSS keyframe dynamically for slide out
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes toastSlideOut {
    to { transform: translateX(120%); opacity: 0; }
}`;
document.head.appendChild(styleSheet);

// ================= API FETCH UTILITY =================
async function apiFetch(url, options = {}) {
    // Show spinner
    elements.loading.classList.remove('hidden');
    
    // Set headers
    if (!options.headers) {
        options.headers = {};
    }
    if (options.body && !(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }
    
    options.credentials = 'include'; // Essential to pass JSESSIONID cookies
    
    try {
        const response = await fetch(url, options);
        const text = await response.text();
        let data = null;
        if (text) {
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { message: text };
            }
        }
        
        if (!response.ok) {
            // Build error message from response JSON
            const errorMsg = data && (data.message || data.error) ? (data.message || data.error) : 'Operation failed';
            throw new Error(errorMsg);
        }
        return data;
    } catch (err) {
        console.error(`API Fetch Error [${url}]:`, err);
        showToast(err.message, 'error');
        throw err;
    } finally {
        // Hide spinner
        elements.loading.classList.add('hidden');
    }
}

// ================= INITIALIZATION & AUTH CHECKS =================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    checkAuthStatus();
});

// Theme Logic
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light-mode';
    document.body.className = savedTheme;
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode';
    const newTheme = currentTheme === 'light-mode' ? 'dark-mode' : 'light-mode';
    document.body.className = newTheme;
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    showToast(`Switched to ${newTheme === 'dark-mode' ? 'Dark' : 'Light'} Mode`, 'success');
}

function updateThemeIcon(theme) {
    const icon = elements.themeToggleBtn.querySelector('i');
    if (theme === 'dark-mode') {
        icon.className = 'fa-solid fa-sun';
    } else {
        icon.className = 'fa-solid fa-moon';
    }
}

async function checkAuthStatus() {
    try {
        const user = await apiFetch('/api/auth/me');
        if (user && user.id) {
            handleLoginSuccess(user);
        } else {
            showLoginView();
        }
    } catch (err) {
        showLoginView();
    }
}

function showLoginView() {
    state.user = null;
    elements.authContainer.classList.remove('hidden');
    elements.studentDashboard.classList.add('hidden');
    elements.adminDashboard.classList.add('hidden');
    elements.userBadge.classList.add('hidden');
    elements.logoutBtn.classList.add('hidden');
}

function handleLoginSuccess(user) {
    state.user = user;
    elements.authContainer.classList.add('hidden');
    elements.userBadge.classList.remove('hidden');
    elements.logoutBtn.classList.remove('hidden');
    
    // Set badge info
    elements.userDisplayName.textContent = user.name;
    elements.userDisplayRole.textContent = user.role;
    elements.userAvatarInitials.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    // Redirect based on role
    if (user.role === 'ADMIN') {
        elements.studentDashboard.classList.add('hidden');
        elements.adminDashboard.classList.remove('hidden');
        loadAdminPortal();
    } else {
        elements.adminDashboard.classList.add('hidden');
        elements.studentDashboard.classList.remove('hidden');
        loadStudentPortal();
    }
    showToast(`Logged in successfully as ${user.name}`, 'success');
}

// ================= EVENT LISTENERS SETUP =================
function setupEventListeners() {
    // Theme Switch
    elements.themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Login Submit
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = elements.loginEmail.value.trim();
        const password = elements.loginPassword.value;
        try {
            const user = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            handleLoginSuccess(user);
        } catch (err) {
            // Handled by API fetch error handler
        }
    });

    // Logout Click
    elements.logoutBtn.addEventListener('click', async () => {
        try {
            await apiFetch('/api/auth/logout', { method: 'POST' });
            showToast('Logged out successfully', 'success');
            showLoginView();
        } catch (err) {
            showLoginView();
        }
    });
    
    // Student Search & Catalog Filtering
    elements.catalogSearch.addEventListener('input', (e) => {
        state.activeFilters.search = e.target.value.toLowerCase();
        renderCourseCatalog();
    });
    
    elements.catalogSort.addEventListener('change', (e) => {
        state.activeFilters.sortBy = e.target.value;
        renderCourseCatalog();
    });
    
    elements.filterHideFull.addEventListener('change', (e) => {
        state.activeFilters.hideFull = e.target.checked;
        renderCourseCatalog();
    });
    
    // Student Cart Submit
    elements.cartSubmitBtn.addEventListener('click', submitPlannerCart);
    
    // Admin Add Course Modal Open
    elements.adminAddCourseBtn.addEventListener('click', () => {
        openCourseFormModal();
    });
    
    // Modal controls
    elements.modalCloseBtn.addEventListener('click', closeCourseModal);
    elements.courseFormCancelBtn.addEventListener('click', closeCourseModal);
    
    // Modal Form Submit (Create/Update course)
    elements.courseForm.addEventListener('submit', submitCourseForm);
}

// ================= STUDENT PORTAL LOGIC =================

async function loadStudentPortal() {
    state.cart = []; // Reset cart
    elements.studentWelcomeName.textContent = state.user.name;
    elements.studentWelcomeMajor.textContent = state.user.major || 'Undeclared';
    
    await fetchTimeSlots();
    await fetchCourses();
    await fetchRegisteredSchedule();
    
    setupDepartmentFilterList();
    renderCourseCatalog();
    updateCartUI();
}

async function fetchTimeSlots() {
    try {
        state.timeSlots = await apiFetch('/api/courses/time-slots');
    } catch (e) {
        state.timeSlots = [];
    }
}

async function fetchCourses() {
    try {
        state.courses = await apiFetch('/api/courses');
    } catch (e) {
        state.courses = [];
    }
}

async function fetchRegisteredSchedule() {
    try {
        state.registeredCourses = await apiFetch('/api/registrations');
        updateRegisteredCreditsTracker();
        renderRegisteredSchedule();
    } catch (e) {
        state.registeredCourses = [];
    }
}

function updateRegisteredCreditsTracker() {
    const totalCredits = state.registeredCourses.reduce((sum, c) => sum + c.credits, 0);
    elements.creditTrackerValue.textContent = `${totalCredits} / ${CREDIT_LIMIT} Credits`;
    
    const percentage = Math.min((totalCredits / CREDIT_LIMIT) * 100, 100);
    elements.creditProgressBar.style.width = `${percentage}%`;
    elements.creditPercentage.textContent = `${Math.round(percentage)}% of maximum credit limit (${CREDIT_LIMIT} credits)`;
    
    // Style progress bar depending on load
    if (percentage > 90) {
        elements.creditProgressBar.style.background = 'var(--danger)';
    } else if (percentage > 60) {
        elements.creditProgressBar.style.background = 'var(--warning)';
    } else {
        elements.creditProgressBar.style.background = 'linear-gradient(90deg, var(--primary), var(--success))';
    }
}

// Setup checkbox filters for departments
function setupDepartmentFilterList() {
    const departments = [...new Set(state.courses.map(c => c.department))];
    elements.filterDepartments.innerHTML = '';
    
    departments.forEach(dept => {
        state.activeFilters.departments.add(dept); // Default all checked
        
        const label = document.createElement('label');
        label.className = 'custom-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = dept;
        checkbox.checked = true;
        
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                state.activeFilters.departments.add(dept);
            } else {
                state.activeFilters.departments.delete(dept);
            }
            renderCourseCatalog();
        });
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${dept}`));
        elements.filterDepartments.appendChild(label);
    });

    // Wire up credit checkboxes (hardcoded in html)
    const creditInputs = document.querySelectorAll('#filter-credits input');
    creditInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.checked) {
                state.activeFilters.credits.add(e.target.value);
            } else {
                state.activeFilters.credits.delete(e.target.value);
            }
            renderCourseCatalog();
        });
    });
}

function renderCourseCatalog() {
    elements.courseCatalogGrid.innerHTML = '';
    
    // Apply filters
    let filtered = state.courses.filter(course => {
        // Search term filter
        const matchSearch = course.courseCode.toLowerCase().includes(state.activeFilters.search) ||
                            course.title.toLowerCase().includes(state.activeFilters.search) ||
                            course.instructor.toLowerCase().includes(state.activeFilters.search);
        
        // Department filter
        const matchDept = state.activeFilters.departments.has(course.department);
        
        // Credits filter
        const matchCredits = state.activeFilters.credits.has(course.credits.toString());
        
        // Availability filter
        const matchAvailability = !state.activeFilters.hideFull || course.remainingSeats > 0;
        
        return matchSearch && matchDept && matchCredits && matchAvailability;
    });
    
    // Apply sorting
    filtered.sort((a, b) => {
        if (state.activeFilters.sortBy === 'code') {
            return a.courseCode.localeCompare(b.courseCode);
        } else if (state.activeFilters.sortBy === 'credits') {
            return b.credits - a.credits;
        } else if (state.activeFilters.sortBy === 'popularity') {
            // Popularity: Enrolled count = total capacity - remaining seats. Sort descending.
            const enrolledA = a.capacity - a.remainingSeats;
            const enrolledB = b.capacity - b.remainingSeats;
            return enrolledB - enrolledA;
        }
        return 0;
    });
    
    if (filtered.length === 0) {
        elements.courseCatalogGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fa-solid fa-magnifying-glass-minus"></i>
                <p>No courses match your active search filter settings.</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(course => {
        const card = document.createElement('div');
        card.className = 'glass-card course-card';
        
        // Seat badge calculation: Green > 10, Orange 1-9, Red = 0 (Full)
        let seatBadgeClass = 'seat-green';
        let seatText = `${course.remainingSeats} / ${course.capacity} seats left`;
        if (course.remainingSeats === 0) {
            seatBadgeClass = 'seat-red';
            seatText = 'Full Course';
        } else if (course.remainingSeats < 10) {
            seatBadgeClass = 'seat-orange';
        }
        
        // Determine registration/cart status
        const isRegistered = state.registeredCourses.some(rc => rc.id === course.id);
        const inCart = state.cart.some(cc => cc.id === course.id);
        
        let actionBtnHTML = '';
        if (isRegistered) {
            actionBtnHTML = `<button class="secondary-btn" disabled><i class="fa-solid fa-circle-check" style="color: var(--success)"></i> Registered</button>`;
        } else if (inCart) {
            actionBtnHTML = `<button class="secondary-btn" onclick="removeFromCart(${course.id})"><i class="fa-solid fa-cart-minus" style="color: var(--danger)"></i> Remove Planner</button>`;
        } else if (course.remainingSeats === 0) {
            actionBtnHTML = `<button class="primary-btn" disabled><i class="fa-solid fa-ban"></i> Course Full</button>`;
        } else {
            actionBtnHTML = `<button class="primary-btn" onclick="addToCart(${course.id})"><i class="fa-solid fa-cart-plus"></i> Add Planner</button>`;
        }
        
        // Prerequisites list
        let prereqHTML = '';
        if (course.prerequisites && course.prerequisites.size > 0 || Array.isArray(course.prerequisites) && course.prerequisites.length > 0) {
            const list = Array.from(course.prerequisites);
            prereqHTML = `
                <div class="meta-item">
                    <i class="fa-solid fa-tags"></i>
                    <span class="prereqs-badges">Prereqs: ${list.map(p => `<span class="prereq-badge">${p}</span>`).join('')}</span>
                </div>
            `;
        } else {
            prereqHTML = `
                <div class="meta-item">
                    <i class="fa-solid fa-tags"></i>
                    <span>Prereqs: <span class="text-secondary" style="font-style:italic; font-size:0.7rem;">None</span></span>
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="course-card-top">
                <div class="course-card-header">
                    <span class="course-code-badge">${course.courseCode}</span>
                    <span class="seat-badge ${seatBadgeClass}">${seatText}</span>
                </div>
                <h4>${course.title}</h4>
                <p class="course-desc">${course.description || 'No description provided.'}</p>
            </div>
            
            <div class="course-card-bottom">
                <div class="course-meta-details">
                    <div class="meta-item">
                        <i class="fa-solid fa-user-tie"></i>
                        <span>Instructor: <strong>${course.instructor}</strong></span>
                    </div>
                    <div class="meta-item">
                        <i class="fa-solid fa-clock"></i>
                        <span>Time: ${course.timeSlot ? course.timeSlot.name : 'TBA'}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fa-solid fa-star"></i>
                        <span>Credits: <strong>${course.credits} Credits</strong></span>
                    </div>
                    ${prereqHTML}
                </div>
                
                <div class="course-card-footer">
                    ${actionBtnHTML}
                </div>
            </div>
        `;
        elements.courseCatalogGrid.appendChild(card);
    });
}

// Expose addToCart and removeFromCart to window object for onclick attributes
window.addToCart = function(courseId) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    
    // Local validation checks:
    // 1. Credit Hour Limit
    const registeredCredits = state.registeredCourses.reduce((sum, c) => sum + c.credits, 0);
    const cartCredits = state.cart.reduce((sum, c) => sum + c.credits, 0);
    if (registeredCredits + cartCredits + course.credits > CREDIT_LIMIT) {
        showToast(`Cannot add ${course.courseCode}. Adding this course exceeds the limit of ${CREDIT_LIMIT} credit hours!`, 'warning');
        return;
    }
    
    state.cart.push(course);
    updateCartUI();
    renderCourseCatalog(); // Refresh buttons
    showToast(`Added ${course.courseCode} to planner cart`, 'success');
};

window.removeFromCart = function(courseId) {
    state.cart = state.cart.filter(c => c.id !== courseId);
    updateCartUI();
    renderCourseCatalog();
    showToast('Removed course from cart', 'info');
};

function updateCartUI() {
    elements.cartItemsContainer.innerHTML = '';
    
    if (state.cart.length === 0) {
        elements.cartItemsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-plus"></i>
                <p>Your cart is empty. Add courses from the catalog to plan your schedule.</p>
            </div>
        `;
        elements.cartTotalCredits.textContent = '0 Credits';
        elements.cartSubmitBtn.disabled = true;
        elements.cartBadgeCount.textContent = '0';
        elements.cartValidationWarning.classList.add('hidden');
        return;
    }
    
    elements.cartBadgeCount.textContent = state.cart.length;
    
    const cartCredits = state.cart.reduce((sum, c) => sum + c.credits, 0);
    elements.cartTotalCredits.textContent = `${cartCredits} Credits`;
    
    // Draw Cart Items
    state.cart.forEach(course => {
        const item = document.createElement('div');
        item.className = 'cart-item';
        item.innerHTML = `
            <div class="cart-item-details">
                <span class="cart-item-code">${course.courseCode}</span>
                <span class="cart-item-title">${course.title}</span>
                <span class="cart-item-time">${course.timeSlot ? course.timeSlot.name : 'TBA'}</span>
            </div>
            <button class="remove-cart-item" onclick="removeFromCart(${course.id})" aria-label="Remove Course">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;
        elements.cartItemsContainer.appendChild(item);
    });
    
    // Perform Cart conflict warnings
    validateCartSchedule();
}

function validateCartSchedule() {
    elements.cartValidationWarning.classList.add('hidden');
    elements.cartSubmitBtn.disabled = false;
    
    // Check overlaps within cart and against registered schedule
    const allPlannerItems = [...state.cart];
    const registeredItems = [...state.registeredCourses];
    
    // 1. Check cart-to-cart overlaps
    for (let i = 0; i < allPlannerItems.length; i++) {
        const itemA = allPlannerItems[i];
        if (!itemA.timeSlot) continue;
        
        for (let j = i + 1; j < allPlannerItems.length; j++) {
            const itemB = allPlannerItems[j];
            if (!itemB.timeSlot) continue;
            
            if (itemA.timeSlot.id === itemB.timeSlot.id) {
                elements.cartWarningText.textContent = `Time Slot overlap: ${itemA.courseCode} and ${itemB.courseCode} both share [${itemA.timeSlot.name}]. Please resolve!`;
                elements.cartValidationWarning.classList.remove('hidden');
                elements.cartSubmitBtn.disabled = true;
                return;
            }
        }
    }
    
    // 2. Check cart-to-registered overlaps
    for (const cartItem of allPlannerItems) {
        if (!cartItem.timeSlot) continue;
        
        for (const regItem of registeredItems) {
            if (!regItem.timeSlot) continue;
            
            if (cartItem.timeSlot.id === regItem.timeSlot.id) {
                elements.cartWarningText.textContent = `Schedule Conflict: Planned ${cartItem.courseCode} overlaps with registered ${regItem.courseCode} on [${cartItem.timeSlot.name}].`;
                elements.cartValidationWarning.classList.remove('hidden');
                elements.cartSubmitBtn.disabled = true;
                return;
            }
        }
    }
}

async function submitPlannerCart() {
    if (state.cart.length === 0) return;
    
    let successCount = 0;
    let failCount = 0;
    
    // Register courses one-by-one to get distinct error feedback for each course
    for (const course of state.cart) {
        try {
            await apiFetch('/api/registrations/register', {
                method: 'POST',
                body: JSON.stringify({ courseId: course.id })
            });
            successCount++;
        } catch (err) {
            failCount++;
            // The apiFetch automatically toasts the error message
        }
    }
    
    if (successCount > 0) {
        showToast(`Successfully registered for ${successCount} course(s)!`, 'success');
    }
    
    // Reset state & reload
    state.cart = [];
    await fetchCourses(); // Fetch updated seat counts
    await fetchRegisteredSchedule(); // Refresh registered schedule
    
    renderCourseCatalog();
    updateCartUI();
}

function renderRegisteredSchedule() {
    elements.scheduleItemsContainer.innerHTML = '';
    
    if (state.registeredCourses.length === 0) {
        elements.scheduleItemsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-xmark"></i>
                <p>You have not registered for any courses yet.</p>
            </div>
        `;
        return;
    }
    
    state.registeredCourses.forEach(course => {
        const item = document.createElement('div');
        item.className = 'schedule-item';
        item.innerHTML = `
            <div class="schedule-item-details">
                <div class="schedule-item-header">
                    <span class="schedule-item-code">${course.courseCode}</span>
                    <span class="schedule-item-credits">${course.credits} Cr</span>
                </div>
                <span class="schedule-item-title">${course.title}</span>
                <span class="schedule-item-time"><i class="fa-regular fa-clock"></i> ${course.timeSlot ? course.timeSlot.name : 'TBA'}</span>
            </div>
            <button class="drop-course-btn" onclick="dropCourse(${course.id})" aria-label="Drop Course">
                Drop
            </button>
        `;
        elements.scheduleItemsContainer.appendChild(item);
    });
}

window.dropCourse = async function(courseId) {
    const course = state.registeredCourses.find(c => c.id === courseId);
    const code = course ? course.courseCode : '';
    if (!confirm(`Are you sure you want to drop course ${code}?`)) return;
    
    try {
        await apiFetch(`/api/registrations/drop/${courseId}`, {
            method: 'DELETE'
        });
        showToast(`Successfully dropped ${code}`, 'success');
        
        // Refresh
        await fetchCourses();
        await fetchRegisteredSchedule();
        
        renderCourseCatalog();
        updateCartUI();
    } catch (err) {
        // Handled
    }
};

// ================= ADMIN PORTAL LOGIC =================

async function loadAdminPortal() {
    await fetchTimeSlots();
    await fetchCourses();
    await fetchAdminAnalytics();
    
    renderAdminCoursesTable();
}

async function fetchAdminAnalytics() {
    try {
        const stats = await apiFetch('/api/admin/analytics');
        elements.adminStatStudents.textContent = stats.totalStudents;
        elements.adminStatRevenue.textContent = `$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        elements.adminStatPopular.innerHTML = '';
        if (stats.popularCourses && stats.popularCourses.length > 0) {
            stats.popularCourses.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `${item.courseName} (<strong>${item.registrations} Students</strong>)`;
                elements.adminStatPopular.appendChild(li);
            });
        } else {
            elements.adminStatPopular.innerHTML = `<li class="popular-empty">No active registrations yet</li>`;
        }
    } catch (err) {
        // Handled
    }
}

function renderAdminCoursesTable() {
    elements.adminCoursesTbody.innerHTML = '';
    
    if (state.courses.length === 0) {
        elements.adminCoursesTbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-secondary);">
                    No courses available in catalog.
                </td>
            </tr>
        `;
        return;
    }
    
    state.courses.forEach(course => {
        const tr = document.createElement('tr');
        
        // Prereq tags
        const prereqsList = course.prerequisites ? Array.from(course.prerequisites) : [];
        const prereqsHTML = prereqsList.length > 0 
            ? prereqsList.map(p => `<span class="crud-table-prereq">${p}</span>`).join(' ')
            : '<span class="text-secondary" style="font-style:italic; font-size:0.75rem;">None</span>';
        
        tr.innerHTML = `
            <td><span class="crud-code">${course.courseCode}</span></td>
            <td><span class="crud-title">${course.title}</span></td>
            <td><strong>${course.credits}</strong></td>
            <td>
                <div class="crud-capacity">
                    <span>${course.remainingSeats} / ${course.capacity}</span>
                </div>
            </td>
            <td><span class="crud-timeslot">${course.timeSlot ? course.timeSlot.name : 'TBA'}</span></td>
            <td><div class="crud-table-prereqs">${prereqsHTML}</div></td>
            <td>
                <div class="crud-instructor">${course.instructor}</div>
                <div class="crud-dept">${course.department}</div>
            </td>
            <td>
                <div class="action-row-btns">
                    <button class="edit-btn" onclick="openCourseFormModal(${course.id})">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="deleteCourse(${course.id})">
                        <i class="fa-solid fa-trash-can"></i> Delete
                    </button>
                </div>
            </td>
        `;
        elements.adminCoursesTbody.appendChild(tr);
    });
}

window.deleteCourse = async function(courseId) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    if (!confirm(`WARNING: Deleting course ${course.courseCode} - ${course.title} will drop all active student registrations. Are you sure?`)) return;
    
    try {
        await apiFetch(`/api/courses/${courseId}`, {
            method: 'DELETE'
        });
        showToast(`Successfully deleted course ${course.courseCode}`, 'success');
        await loadAdminPortal(); // Refresh table & stats
    } catch (e) {
        // Handled
    }
};

// Open Modal to Add/Edit
function openCourseFormModal(courseId = null) {
    elements.courseModal.classList.remove('hidden');
    elements.courseForm.reset();
    
    // Fill Time Slot Select options
    elements.courseFormTimeslot.innerHTML = '<option value="" disabled selected>Select class schedule...</option>';
    state.timeSlots.forEach(ts => {
        const option = document.createElement('option');
        option.value = ts.id;
        option.textContent = ts.name;
        elements.courseFormTimeslot.appendChild(option);
    });
    
    // Fill Prerequisites selector (excluding the course itself to prevent self-prerequisites)
    elements.courseFormPrereqs.innerHTML = '';
    const otherCourses = state.courses.filter(c => courseId === null || c.id !== courseId);
    if (otherCourses.length > 0) {
        otherCourses.forEach(c => {
            const label = document.createElement('label');
            label.className = 'custom-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = c.id;
            checkbox.name = 'prerequisites';
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${c.courseCode} - ${c.title}`));
            elements.courseFormPrereqs.appendChild(label);
        });
    } else {
        elements.courseFormPrereqs.innerHTML = '<span class="text-secondary" style="font-style:italic; font-size:0.8rem; padding: 0.25rem;">No other courses available in catalog.</span>';
    }
    
    if (courseId) {
        // EDIT MODE
        const course = state.courses.find(c => c.id === courseId);
        elements.modalTitle.textContent = `Edit Course: ${course.courseCode}`;
        elements.courseFormId.value = course.id;
        elements.courseFormCode.value = course.courseCode;
        elements.courseFormTitle.value = course.title;
        elements.courseFormDesc.value = course.description || '';
        elements.courseFormCredits.value = course.credits;
        elements.courseFormCapacity.value = course.capacity;
        elements.courseFormInstructor.value = course.instructor;
        elements.courseFormDept.value = course.department;
        
        if (course.timeSlot) {
            elements.courseFormTimeslot.value = course.timeSlot.id;
        }
        
        // Check prerequisite boxes
        if (course.prerequisites) {
            const prereqsSet = new Set(course.prerequisites);
            const checkboxes = elements.courseFormPrereqs.querySelectorAll('input[name="prerequisites"]');
            checkboxes.forEach(box => {
                const checkCourse = state.courses.find(c => c.id === parseInt(box.value));
                if (checkCourse && prereqsSet.has(checkCourse.courseCode)) {
                    box.checked = true;
                }
            });
        }
    } else {
        // ADD MODE
        elements.modalTitle.textContent = 'Add New Course';
        elements.courseFormId.value = '';
    }
}

function closeCourseModal() {
    elements.courseModal.classList.add('hidden');
}

async function submitCourseForm(e) {
    e.preventDefault();
    
    const id = elements.courseFormId.value;
    const courseCode = elements.courseFormCode.value.trim().toUpperCase();
    const title = elements.courseFormTitle.value.trim();
    const description = elements.courseFormDesc.value.trim();
    const credits = parseInt(elements.courseFormCredits.value);
    const capacity = parseInt(elements.courseFormCapacity.value);
    const instructor = elements.courseFormInstructor.value.trim();
    const department = elements.courseFormDept.value.trim();
    const timeSlotId = elements.courseFormTimeslot.value;
    
    // Resolve full time slot object
    const timeSlot = state.timeSlots.find(ts => ts.id === parseInt(timeSlotId));
    
    // Collect prerequisites
    const prereqCheckboxes = elements.courseFormPrereqs.querySelectorAll('input[name="prerequisites"]:checked');
    const prerequisites = Array.from(prereqCheckboxes).map(box => {
        return { id: parseInt(box.value) };
    });
    
    const payload = {
        courseCode,
        title,
        description,
        credits,
        capacity,
        instructor,
        department,
        timeSlot: timeSlot ? { id: timeSlot.id } : null,
        prerequisites
    };
    
    const url = id ? `/api/courses/${id}` : '/api/courses';
    const method = id ? 'PUT' : 'POST';
    
    try {
        await apiFetch(url, {
            method,
            body: JSON.stringify(payload)
        });
        showToast(id ? 'Course updated successfully' : 'Course created successfully', 'success');
        closeCourseModal();
        await loadAdminPortal(); // Refresh list and stats
    } catch (err) {
        // Handled
    }
}
