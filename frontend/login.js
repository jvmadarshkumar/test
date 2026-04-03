const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("https://market-project-mspl.onrender.com/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Login Successful ✅");

            localStorage.setItem("token", data.token);

            // ✅ redirect
            window.location.href = "dashboard.html";
        } else {
            alert("Login failed ❌");
        }

    } catch (err) {
        console.error(err);
        alert("Server error ⚠️");
    }
});