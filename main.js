let token = "";
        let role = "";

        function switchTab(tab) {
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            const tabBtns = document.querySelectorAll('.tab-btn');

            tabBtns.forEach(btn => btn.classList.remove('active'));
            
            if (tab === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
                tabBtns[0].classList.add('active');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
                tabBtns[1].classList.add('active');
            }
        }

        async function register() {
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const roleValue = document.getElementById('regRole').value;

            if (!username || !password) {
                showAuthResponse('Please fill in all fields', 'error');
                return;
            }

            try {
                const res = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                        role: roleValue
                    })
                });
                const result = await res.text();
                showAuthResponse(result, res.ok ? 'success' : 'error');
            } catch (error) {
                showAuthResponse('Registration failed: ' + error.message, 'error');
            }
        }

        async function login() {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            if (!username || !password) {
                showAuthResponse('Please fill in all fields', 'error');
                return;
            }

            try {
                const res = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });
                const data = await res.json();
                showAuthResponse(JSON.stringify(data, null, 2), res.ok ? 'success' : 'error');
                
                if (data.token) {
                    token = data.token;
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    role = payload.role;
                    showDashboard();
                }
            } catch (error) {
                showAuthResponse('Login failed: ' + error.message, 'error');
            }
        }

        function showAuthResponse(message, type) {
            const authResponse = document.getElementById('authResponse');
            const authResponseContent = document.getElementById('authResponseContent');
            
            authResponseContent.textContent = message;
            authResponseContent.className = 'response-content ' + (type === 'success' ? 'success-message' : 'error-message');
            authResponse.classList.remove('hidden');
        }

        // Fetch accepted rides for the current user and populate the dropdown
        async function refreshAcceptedRides() {
            try {
                const res = await fetch('/rides/history', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const rides = await res.json();
                const select = document.getElementById('payRideId');
                select.innerHTML = '<option value="">Select Accepted Ride</option>';
                if (Array.isArray(rides)) {
                    rides
                        .filter(ride => ride.status === 'Accepted' && ride.paymentStatus !== 'Paid')
                        .forEach(ride => {
                            select.innerHTML += `<option value="${ride._id}">${ride._id} - ${ride.destination} (${ride.amount ? 'RM' + ride.amount : 'No Amount'})</option>`;
                        });
                }
            } catch (error) {
                updateResponse('Failed to load rides: ' + error.message);
            }
        }

        // Populate pending rides for driver to accept
        async function refreshPendingRides() {
            try {
                const res = await fetch('/rides/available', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const rides = await res.json();
                const select = document.getElementById('acceptRideId');
                select.innerHTML = '<option value="">Select Pending Ride</option>';
                if (Array.isArray(rides)) {
                    rides
                        .filter(ride => ride.status === 'Pending')
                        .forEach(ride => {
                            select.innerHTML += `<option value="${ride._id}">${ride._id} - ${ride.destination} (${ride.amount ? 'RM' + ride.amount : 'No Amount'})</option>`;
                        });
                }
            } catch (error) {
                updateResponse('Failed to load pending rides: ' + error.message);
            }
        }

        // Populate accepted rides for driver to cancel (only rides accepted by this driver)
        async function refreshDriverAcceptedRides() {
            try {
                const res = await fetch('/rides/history', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const rides = await res.json();
                const select = document.getElementById('cancelRideId');
                select.innerHTML = '<option value="">Select Accepted Ride</option>';
                if (Array.isArray(rides)) {
                    rides
                        .filter(ride => ride.status === 'Accepted' && ride.driverId === getUserIdFromToken())
                        .forEach(ride => {
                            select.innerHTML += `<option value="${ride._id}">${ride._id} - ${ride.destination}</option>`;
                        });
                }
            } catch (error) {
                updateResponse('Failed to load accepted rides: ' + error.message);
            }
        }

        // Helper to get userId from JWT token
        function getUserIdFromToken() {
            if (!token) return null;
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.userId;
            } catch {
                return null;
            }
        }

        // Auto-refresh accepted rides when dashboard is shown (user only)
        function showDashboard() {
            document.getElementById('authSection').classList.add('hidden');
            document.getElementById('dashboardSection').classList.remove('hidden');
            document.getElementById('dashboardSection').classList.add('fade-in');
            
            document.getElementById('roleBadge').textContent = role;
            document.getElementById('welcomeText').textContent = `Welcome, ${role}!`;
            
            document.getElementById('userActions').classList.toggle('hidden', role !== 'user');
            document.getElementById('driverActions').classList.toggle('hidden', role !== 'driver');
            document.getElementById('adminActions').classList.toggle('hidden', role !== 'admin');
            document.getElementById('paymentActions').classList.toggle('hidden', role !== 'user');
            document.getElementById('driverRideActions').classList.toggle('hidden', role !== 'driver');
            document.getElementById('adminUserManagement').classList.toggle('hidden', role !== 'admin');

            // Refresh accepted rides for payment dropdown if user
            if (role === 'user') {
                refreshAcceptedRides();
            }
            // Refresh pending and accepted rides if driver
            else if (role === 'driver') {
                refreshPendingRides();
                refreshDriverAcceptedRides();
            }
        }

        function logout() {
            token = "";
            role = "";
            document.getElementById('authSection').classList.remove('hidden');
            document.getElementById('dashboardSection').classList.add('hidden');
            document.getElementById('authResponse').classList.add('hidden');
            document.getElementById('response').innerHTML = '<div class="empty-response">No response yet. Try performing an action.</div>';
            
            // Clear form fields
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
            document.getElementById('regUsername').value = '';
            document.getElementById('regPassword').value = '';
        }

        async function requestRide() {
            const destination = document.getElementById('destination').value;
            const distance = document.getElementById('distance').value;

            if (!destination || !distance) {
                updateResponse('Please fill in destination and distance');
                return;
            }

            try {
                const res = await fetch('/rides', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        destination: destination,
                        distance: parseFloat(distance)
                    })
                });
                const result = await res.text();
                updateResponse(result);
            } catch (error) {
                updateResponse('Ride request failed: ' + error.message);
            }
        }

        async function payRide() {
            const rideId = document.getElementById('payRideId').value;
            const paymentMethod = document.getElementById('paymentMethod').value;
            const amount = document.getElementById('paymentAmount').value;

            if (!rideId || !paymentMethod || !amount) {
                updateResponse('Please fill in all payment fields');
                return;
            }

            try {
                const res = await fetch(`/rides/${rideId}/pay`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        paymentMethod: paymentMethod,
                        amount: parseFloat(amount)
                    })
                });
                const result = await res.text();
                updateResponse(result);
            } catch (error) {
                updateResponse('Payment failed: ' + error.message);
            }
        }

        async function getHistory() {
            await apiCall('/rides/history');
        }

        async function getAvailableRides() {
            await apiCall('/rides/available');
        }

        async function acceptRide() {
            const rideId = document.getElementById('acceptRideId').value;
            if (!rideId) {
                updateResponse('Please select a ride to accept');
                return;
            }
            try {
                const res = await fetch(`/rides/${rideId}/accept`, {
                    method: 'PATCH',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const result = await res.text();
                updateResponse(result);
                refreshPendingRides();
                refreshDriverAcceptedRides();
            } catch (error) {
                updateResponse('Accept ride failed: ' + error.message);
            }
        }

        async function cancelRide() {
            const rideId = document.getElementById('cancelRideId').value;
            if (!rideId) {
                updateResponse('Please select a ride to cancel');
                return;
            }
            try {
                const res = await fetch(`/rides/${rideId}/cancel`, {
                    method: 'PATCH',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const result = await res.text();
                updateResponse(result);
                refreshPendingRides();
                refreshDriverAcceptedRides();
            } catch (error) {
                updateResponse('Cancel ride failed: ' + error.message);
            }
        }

        async function getUsers() {
            await apiCall('/admin/users');
        }

        async function getRides() {
            await apiCall('/admin/rides');
        }

        async function getAnalytics() {
            try {
                const res = await fetch('/admin/analytics', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await res.json();

                let html = `
                <div class="analytics-section">
                    <h3>User Analytics</h3>
                    <table class="analytics-table">
                        <tr>
                            <th>Username</th>
                            <th>Total Rides</th>
                            <th>Total Fare</th>
                            <th>Avg Distance</th>
                        </tr>
                        ${data.userAnalytics.map(u => `
                            <tr>
                                <td>${u.username}</td>
                                <td>${u.totalRides}</td>
                                <td>RM ${u.totalFare.toFixed(2)}</td>
                                <td>${u.avgDistance.toFixed(2)} km</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
                <div class="analytics-section">
                    <h3>Driver Analytics</h3>
                    <table class="analytics-table">
                        <tr>
                            <th>Driver Name</th>
                            <th>Total Rides</th>
                            <th>Total Fare</th>
                            <th>Avg Distance</th>
                        </tr>
                        ${data.driverAnalytics.map(d => `
                            <tr>
                                <td>${d.drivername}</td>
                                <td>${d.totalRides}</td>
                                <td>RM ${d.totalFare.toFixed(2)}</td>
                                <td>${d.avgDistance.toFixed(2)} km</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
                <div class="analytics-section">
                    <h3>Overall</h3>
                    <table class="analytics-table">
                        <tr>
                            <th>Total Rides</th>
                            <th>Total Fare</th>
                            <th>Avg Distance</th>
                        </tr>
                        <tr>
                            <td>${data.overall.totalRides}</td>
                            <td>RM ${data.overall.totalFare.toFixed(2)}</td>
                            <td>${data.overall.avgDistance.toFixed(2)} km</td>
                        </tr>
                    </table>
                </div>
                `;

                document.getElementById('response').innerHTML = html;
            } catch (error) {
                updateResponse('Failed to load analytics: ' + error.message);
            }
        }

        async function apiCall(endpoint) {
            try {
                const res = await fetch(endpoint, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const result = await res.text();
                updateResponse(result);
            } catch (error) {
                updateResponse('API call failed: ' + error.message);
            }
        }

        function updateResponse(content) {
            const responseDiv = document.getElementById('response');
            let html = "";

            try {
                const obj = JSON.parse(content);

                // Array of objects: render as table
                if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
                    html += "<table style='width:100%;border-collapse:collapse;'>";
                    // Table header
                    html += "<tr>";
                    Object.keys(obj[0]).forEach(key => {
                        html += `<th style='border:1px solid #e9ecef;padding:8px;background:#f1f3f4;text-align:left;'>${key}</th>`;
                    });
                    html += "</tr>";
                    // Table rows
                    obj.forEach(row => {
                        html += "<tr>";
                        Object.values(row).forEach(val => {
                            html += `<td style='border:1px solid #e9ecef;padding:8px;'>${val}</td>`;
                        });
                        html += "</tr>";
                    });
                    html += "</table>";
                }
                // Single object: render as key-value list
                else if (typeof obj === 'object' && obj !== null) {
                    html += "<ul style='list-style:none;padding:0;'>";
                    Object.entries(obj).forEach(([key, val]) => {
                        html += `<li><strong>${key}:</strong> ${typeof val === 'object' ? JSON.stringify(val) : val}</li>`;
                    });
                    html += "</ul>";
                }
                // Other: fallback to pretty JSON
                else {
                    html = `<pre>${syntaxHighlight(obj)}</pre>`;
                }
            } catch {
                // Not JSON, show as plain text
                html = `<pre style="color:#721c24;background:#f8d7da;border-radius:8px;padding:12px;">${content}</pre>`;
            }

            responseDiv.innerHTML = html;
            responseDiv.classList.add('fade-in');
            setTimeout(() => responseDiv.classList.remove('fade-in'), 500);
        }

        // Syntax highlighting for JSON
        function syntaxHighlight(json) {
            if (typeof json != 'string') {
                json = JSON.stringify(json, undefined, 2);
            }
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return `<span class="${cls}">${match}</span>`;
            });
        }

        // Add enter key support for forms
        document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement.closest('#loginForm')) {
                    login();
                } else if (activeElement.closest('#registerForm')) {
                    register();
                }
            }
        });

        // Toggle password visibility
        function togglePassword(inputId, iconSpan) {
            const input = document.getElementById(inputId);
            const icon = iconSpan.querySelector('i');
            if (input.type === "password") {
                input.type = "text";
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                icon.style.color = "#007E33";
            } else {
                input.type = "password";
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                icon.style.color = "#888";
            }
        }

        async function loadAdminUsers() {
            try {
                const res = await fetch('/admin/users', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const users = await res.json();
                let html = `<table>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>`;
                users.forEach(user => {
                    html += `<tr>
                        <td>${user.username}</td>
                        <td>${user.role}</td>
                        <td>
                            <button class="admin-action-btn" onclick="showEditUserModal('${user._id}', '${user.username}', '${user.role}')">Edit</button>
                            <button class="admin-action-btn delete" onclick="deleteUser('${user._id}')">Delete</button>
                        </td>
                    </tr>`;
                });
                html += `</table>`;
                document.getElementById('adminUsersTable').innerHTML = html;
            } catch (error) {
                updateResponse('Failed to load users: ' + error.message);
            }
        }

        function showEditUserModal(id, username, role) {
            document.getElementById('editUserId').value = id;
            document.getElementById('editUsername').value = username;
            document.getElementById('editRole').value = role;
            document.getElementById('editUserModal').classList.remove('hidden');
        }

        function closeEditUserModal() {
            document.getElementById('editUserModal').classList.add('hidden');
        }

        async function submitEditUser() {
            const id = document.getElementById('editUserId').value;
            const username = document.getElementById('editUsername').value;
            const role = document.getElementById('editRole').value;
            const password = document.getElementById('editPassword').value;
            const body = { username, role };
            if (password) body.password = password;
            try {
                const res = await fetch(`/admin/users/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(body)
                });
                const result = await res.text();
                updateResponse(result);
                closeEditUserModal();
                loadAdminUsers();
            } catch (error) {
                updateResponse('Failed to update user: ' + error.message);
            }
        }

        async function deleteUser(id) {
            if (!confirm('Are you sure you want to delete this user?')) return;
            try {
                const res = await fetch(`/admin/users/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const result = await res.text();
                updateResponse(result);
                loadAdminUsers();
            } catch (error) {
                updateResponse('Failed to delete user: ' + error.message);
            }
        }